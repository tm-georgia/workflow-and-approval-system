import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const response = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data }) as Response;

describe("F-02/F-03 Requester integration UI evidence", () => {
  it("TEST-F02-UI-SUCCESS: confirms a saved request and reloads history", async () => {
    let saved = false;
    vi.stubGlobal("fetch", vi.fn(async (path, init) => {
      if (path === "/api/auth/me") return response({ id: 2, email: "requester@example.test", role: "REQUESTER" });
      if (init?.method === "POST") { saved = true; return response({}, 201); }
      return response(saved ? [{ id: 4, title: "Equipment", description: "New keyboard", status: "PENDING", createdAt: "2026-11-12T00:00:00Z" }] : []);
    }));
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText("Title"), "Equipment");
    await user.type(screen.getByLabelText("Description"), "New keyboard");
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Request saved as Pending.");
    expect(await screen.findByText("Equipment")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
  });

  it("shows the owner the rejection reason from the retrieved history", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path) => path === "/api/auth/me"
      ? response({ id: 2, email: "requester@example.test", role: "REQUESTER" })
      : response([{ id: 4, title: "Equipment", description: "New keyboard", status: "REJECTED",
          createdAt: "2026-11-12T00:00:00Z",
          history: [{ id: 1, action: "REJECTED", reason: "Exceeds department budget" }] }])));
    render(<App />);
    expect(await screen.findByText("Exceeds department budget")).toBeInTheDocument();
  });

  it("TEST-F03-UI-OWNER: displays the retrieved decision and its minimum history metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async (path) => path === "/api/auth/me"
      ? response({ id: 2, email: "requester@example.test", role: "REQUESTER" })
      : response([{ id: 4, title: "Equipment", description: "Saved decision", status: "APPROVED", reviewerId: 1, decidedAt: "2026-11-12T01:00:00Z", createdAt: "2026-11-12T00:00:00Z",
          history: [{ id: 1, action: "APPROVED", reason: "Approved within the quarterly budget" }] }])));
    render(<App />);
    expect(await screen.findByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText(/Decision by Reviewer #1 on/)).toBeInTheDocument();
    expect(screen.getByText("Approved within the quarterly budget")).toBeInTheDocument();
    expect(screen.getByText(/Approval reason/)).toBeInTheDocument();
  });


  it("TEST-DEF-001: keeps long request titles and descriptions within their containers", async () => {
    const longTitle = "T".repeat(150);
    const longDescription = "D".repeat(300);

    vi.stubGlobal("fetch", vi.fn(async (path) =>
      path === "/api/auth/me"
        ? response({ id: 2, email: "requester@example.test", role: "REQUESTER" })
        : response([{
            id: 5,
            title: longTitle,
            description: longDescription,
            status: "PENDING",
            createdAt: "2026-11-27T00:00:00Z",
          }])
    ));

    render(<App />);

    const titleElement = await screen.findByText(longTitle);
    const descriptionElement = screen.getByText(longDescription);

    expect(window.getComputedStyle(titleElement).overflowWrap).toBe("anywhere");
    expect(window.getComputedStyle(titleElement).minWidth).toBe("0px");
    expect(window.getComputedStyle(descriptionElement).overflowWrap).toBe("anywhere");
  });

});
