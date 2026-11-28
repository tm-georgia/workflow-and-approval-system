import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("TEST-06: shows a history-refresh warning after successful submission", async () => {
    const user = userEvent.setup();
    const savedRequests: Array<Record<string, unknown>> = [];
    let mineCalls = 0;

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

        if (path === "/api/requests/mine") {
          mineCalls += 1;

          // Initial history load succeeds.
          if (mineCalls === 1) {
            return fakeResponse([]);
          }

          // History refresh after submission fails.
          throw new Error("Failed to fetch");
        }

        if (path === "/api/requests" && method === "POST") {
          const submitted = JSON.parse(String(init?.body ?? "{}"));
          const saved = {
            id: 45,
            ...submitted,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          };

          savedRequests.push(saved);
          return fakeResponse(saved, 201);
        }

        throw new Error(`Unexpected request: ${method} ${path}`);
      }
    );

    vi.stubGlobal("fetch", fakeFetch);
    render(<App />);

    // Sign in as Requester.
    await user.type(
      await screen.findByLabelText("Email"),
      "requester@example.test"
    );
    await user.type(screen.getByLabelText("Password"), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Submit a new request.
    await user.type(screen.getByLabelText("Title"), "History refresh test");
    await user.type(
      screen.getByLabelText("Description"),
      "Testing a failed history refresh after a successful save."
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    // Confirm the request was successfully saved.
    expect(savedRequests).toHaveLength(1);
    expect(await screen.findByText("Request saved as Pending."))
      .toBeInTheDocument();

    // The application should explain that only the history refresh failed.
    expect(
      await screen.findByText(
        "Request saved, but your request history could not be refreshed. Please try again."
      )
    ).toBeInTheDocument();
  });
    it("TEST-07: retries history successfully without submitting again", async () => {
    const user = userEvent.setup();
    const savedRequests: Array<Record<string, unknown>> = [];
    let mineCalls = 0;
    let postCalls = 0;

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

        if (path === "/api/requests/mine") {
          mineCalls += 1;

          // Initial history load succeeds.
          if (mineCalls === 1) {
            return fakeResponse([]);
          }

          // History refresh after submission fails.
          if (mineCalls === 2) {
            throw new Error("Failed to fetch");
          }

          // Retry succeeds and returns the saved request.
          return fakeResponse(savedRequests);
        }

        if (path === "/api/requests" && method === "POST") {
          postCalls += 1;

          const submitted = JSON.parse(String(init?.body ?? "{}"));
          const saved = {
            id: 46,
            ...submitted,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          };

          savedRequests.push(saved);
          return fakeResponse(saved, 201);
        }

        throw new Error(`Unexpected request: ${method} ${path}`);
      }
    );

    vi.stubGlobal("fetch", fakeFetch);
    render(<App />);

    // Sign in as Requester.
    await user.type(
      await screen.findByLabelText("Email"),
      "requester@example.test"
    );
    await user.type(screen.getByLabelText("Password"), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Submit a request.
    await user.type(screen.getByLabelText("Title"), "Retry history test");
    await user.type(
      screen.getByLabelText("Description"),
      "Testing successful history recovery."
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    // Confirm the history-refresh warning appears.
    const warning =
      "Request saved, but your request history could not be refreshed. Please try again.";

    expect(await screen.findByText(warning)).toBeInTheDocument();

    // Retry history retrieval.
    await user.click(screen.getByRole("button", { name: "Retry history" }));

    // Confirm history updates and warning disappears.
    expect(await screen.findByText("Retry history test")).toBeInTheDocument();
    expect(screen.queryByText(warning)).not.toBeInTheDocument();

    // Confirm the request was submitted only once.
    expect(postCalls).toBe(1);
    expect(mineCalls).toBe(3);
  });
    it("TEST-08: preserves previous history when retry fails", async () => {
    const user = userEvent.setup();
    let mineCalls = 0;
    let postCalls = 0;

    const previousRequest = {
      id: 10,
      title: "Previous request",
      description: "Existing history",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

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

        if (path === "/api/requests/mine") {
          mineCalls += 1;

          if (mineCalls === 1) {
            return fakeResponse([previousRequest]);
          }

          throw new Error("Failed to fetch");
        }

        if (path === "/api/requests" && method === "POST") {
          postCalls += 1;

          return fakeResponse({
            id: 47,
            title: "New request",
            description: "Testing retry failure",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          }, 201);
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

    // Confirm the previous history is displayed.
    expect(await screen.findByText("Previous request")).toBeInTheDocument();

    // Submit a new request. The subsequent history refresh fails.
    await user.type(screen.getByLabelText("Title"), "New request");
    await user.type(
      screen.getByLabelText("Description"),
      "Testing retry failure"
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    const warning =
      "Request saved, but your request history could not be refreshed. Please try again.";

    expect(await screen.findByText(warning)).toBeInTheDocument();

    // Retry history retrieval. It fails again.
    await user.click(screen.getByRole("button", { name: "Retry history" }));

    // Previous history must remain visible.
    expect(screen.getByText("Previous request")).toBeInTheDocument();

    // Warning must remain visible.
    expect(screen.getByText(warning)).toBeInTheDocument();

    // No duplicate submission.
    expect(postCalls).toBe(1);
  });
    it("TEST-09: shows loading feedback and prevents duplicate retries", async () => {
    const user = userEvent.setup();
    let mineCalls = 0;
    let postCalls = 0;
    let finishRetry!: (response: Response) => void;

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

        if (path === "/api/requests/mine") {
          mineCalls += 1;

          if (mineCalls === 1) {
            return fakeResponse([]);
          }

          if (mineCalls === 2) {
            throw new Error("Failed to fetch");
          }

          return new Promise<Response>((resolve) => {
            finishRetry = resolve;
          });
        }

        if (path === "/api/requests" && method === "POST") {
          postCalls += 1;
          return fakeResponse({
            id: 48,
            title: "Loading test request",
            description: "Testing retry loading",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          }, 201);
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

    await user.type(screen.getByLabelText("Title"), "Loading test request");
    await user.type(
      screen.getByLabelText("Description"),
      "Testing retry loading"
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    const retryButton = await screen.findByRole("button", {
      name: "Retry history",
    });

    // Start retry without waiting for it to finish.
    await user.click(retryButton);

    // Loading feedback should appear and the button should be disabled.
    const refreshingButton = await screen.findByRole("button", {
      name: "Refreshing...",
    });

    expect(refreshingButton).toBeDisabled();

    // Complete the pending history request.
    finishRetry(fakeResponse([]));

    // Wait for the retry to finish and confirm the warning is cleared.
await waitFor(() => {
  expect(
    screen.queryByRole("button", { name: "Retry history" })
  ).not.toBeInTheDocument();
});

    expect(postCalls).toBe(1);
    expect(mineCalls).toBe(3);
  });
});