import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function fakeResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe("Requester website journey", () => {
  it("TEST-UI-01: signs in, submits a request, and shows its Pending status", async () => {
    const user = userEvent.setup();
    const savedRequests: Array<Record<string, unknown>> = [];

    const fakeFetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const method = init?.method ?? "GET";

        if (path === "/api/auth/me") {
          return fakeResponse({ error: "Please sign in." }, 401);
        }

        if (path === "/api/auth/login") {
          return fakeResponse({
            id: 1,
            email: "requester@example.test",
            role: "REQUESTER",
          });
        }

        if (path === "/api/requests" && method === "POST") {
          const submitted = JSON.parse(String(init?.body ?? "{}"));
          const saved = {
            id: 44,
            ...submitted,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          };
          savedRequests.push(saved);
          return fakeResponse(saved, 201);
        }

        if (path === "/api/requests/mine") {
          return fakeResponse(savedRequests);
        }

        throw new Error(`Unexpected request: ${method} ${path}`);
      }
    );

    vi.stubGlobal("fetch", fakeFetch);
    render(<App />);

    await user.type(
      await screen.findByLabelText("Email"),
      "requester@example.test"
    );
    await user.type(screen.getByLabelText("Password"), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await user.type(screen.getByLabelText("Title"), "UI test request");
    await user.type(
      screen.getByLabelText("Description"),
      "Checking the Requester submission screen"
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("UI test request")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });
});