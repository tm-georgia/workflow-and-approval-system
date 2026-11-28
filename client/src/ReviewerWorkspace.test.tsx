import { describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import ReviewerWorkspace from "./ReviewerWorkspace";

const pending = { id: 11, title: "Travel request", description: "Attend a workshop", status: "PENDING", requesterId: 2, assignedReviewerId: 1, reviewerId: null, decidedAt: null, createdAt: "2026-11-12T00:00:00.000Z" };
function response(data: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => data } as Response;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function mockApi(handler: (path: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path === "/api/auth/me") return response({ id: 1, email: "reviewer@example.test", role: "REVIEWER" });
    if (path === "/api/auth/logout") return response(null, 204);
    return handler(path, init);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

it("F04-REJ-T04 validates a blank reason, keeps the draft on failure, and submits it on retry", async () => {
  let attempts = 0;
  const fetchMock = mockApi(async (_path, init) => {
    if (init?.method === "PATCH") {
      attempts++;
      return attempts === 1 ? response({ error: "Could not save the decision." }, 500) : response({ ...pending, status: "REJECTED" });
    }
    return response(attempts < 2 ? [pending] : []);
  });
  const user = userEvent.setup();
  render(<App />);
  const field = await screen.findByRole("textbox", { name: "Reason for rejection or return of request #11" });
  const reject = screen.getByRole("button", { name: "Reject request #11" });
  await user.type(field, "   ");
  await user.click(reject);
  expect(screen.getByRole("alert")).toHaveTextContent("Provide a reason for rejection.");
  expect(field).toHaveAttribute("aria-invalid", "true");
  expect(attempts).toBe(0);

  const draft = "  Workshop exceeds budget  ";
  await user.clear(field);
  await user.type(field, draft);
  await user.click(reject);
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the decision.");
  expect(field).toHaveValue(draft);
  await user.click(reject);
  expect(await screen.findByText("Request #11 rejected.")).toBeInTheDocument();
  expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
  expect(attempts).toBe(2);
  expect(fetchMock).toHaveBeenCalledWith("/api/requests/11/decision", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ decision: "REJECTED", reason: draft.trim() }),
  }));
});

describe("F-03 Reviewer workspace through the application", () => {
  it.each(["APPROVED", "REJECTED"])("TEST-F03-UI-STRICT-01: an obsolete GET cannot restore a request after %s", async (decision) => {
    const obsolete = deferred<Response>();
    const current = deferred<Response>();
    let gets = 0;
    mockApi(async (_path, init) => {
      if (init?.method === "PATCH") return response({ ...pending, status: decision });
      gets++;
      if (gets === 1) return obsolete.promise;
      if (gets === 2) return current.promise;
      return response([]);
    });
    const user = userEvent.setup();
    render(<StrictMode><ReviewerWorkspace /></StrictMode>);
    await waitFor(() => expect(gets).toBe(2));
    await act(async () => { current.resolve(response([pending])); });
    if (decision === "REJECTED") {
      await user.type(await screen.findByRole("textbox", { name: "Reason for rejection or return of request #11" }), "Budget limit exceeded");
    }
    await user.click(await screen.findByRole("button", { name: `${decision === "APPROVED" ? "Approve" : "Reject"} request #11` }));
    expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
    await act(async () => { obsolete.resolve(response([pending])); });
    expect(screen.queryByText("Travel request")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /(?:Approve|Reject) request #11/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`Request #11 ${decision.toLowerCase()}.`);
  });

  it("TEST-F03-UI-STRICT-02: an obsolete GET error cannot replace successful decision feedback", async () => {
    const obsolete = deferred<Response>();
    let gets = 0;
    mockApi(async (_path, init) => {
      if (init?.method === "PATCH") return response({ ...pending, status: "APPROVED" });
      gets++;
      if (gets === 1) return obsolete.promise;
      return response(gets === 2 ? [pending] : []);
    });
    const user = userEvent.setup();
    render(<StrictMode><ReviewerWorkspace /></StrictMode>);
    await user.click(await screen.findByRole("button", { name: "Approve request #11" }));
    expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
    await act(async () => { obsolete.resolve(response({ error: "Obsolete failure" }, 500)); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Request #11 approved.");
  });

  it("TEST-F03-UI-STRICT-03: an obsolete GET cannot clear a newer refresh's loading state", async () => {
    const obsolete = deferred<Response>();
    const refresh = deferred<Response>();
    let gets = 0;
    mockApi(async () => {
      gets++;
      if (gets === 1) return obsolete.promise;
      if (gets === 2) return response([pending]);
      return refresh.promise;
    });
    const user = userEvent.setup();
    render(<StrictMode><ReviewerWorkspace /></StrictMode>);
    await screen.findByText("Travel request");
    await user.click(screen.getByRole("button", { name: "Refresh pending requests" }));
    await act(async () => { obsolete.resolve(response([pending])); });
    expect(screen.getByRole("status")).toHaveTextContent("Loading pending requests…");
    expect(screen.getByRole("button", { name: "Refresh pending requests" })).toBeDisabled();
    await act(async () => { refresh.resolve(response([])); });
    expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
  });

  it("TEST-F03-UI-01: restores a Reviewer session and renders pending request details", async () => {
    const fetchMock = mockApi(async () => response([pending]));
    render(<App />);
    expect(await screen.findByText("Travel request")).toBeInTheDocument();
    expect(screen.getByText("Attend a workshop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve request #11" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reject request #11" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith("/api/requests/pending", expect.objectContaining({ credentials: "include" }));
    expect(fetchMock.mock.calls.some(([path]) => path === "/api/requests/mine")).toBe(false);
  });

  it.each(["APPROVED", "REJECTED"])("TEST-F03-UI-02/03: saves %s then refreshes the list", async (decision) => {
    let saved = false;
    const fetchMock = mockApi(async (path, init) => {
      if (init?.method === "PATCH") { saved = true; return response({ ...pending, status: decision, reviewerId: 1, decidedAt: "2026-11-12T01:00:00.000Z" }); }
      if (path === "/api/requests/pending") return response(saved ? [] : [pending]);
      throw new Error("Unexpected route");
    });
    const user = userEvent.setup();
    render(<App />);
    if (decision === "REJECTED") {
      await user.type(await screen.findByRole("textbox", { name: "Reason for rejection or return of request #11" }), "Budget limit exceeded");
    }
    await user.click(await screen.findByRole("button", { name: `${decision === "APPROVED" ? "Approve" : "Reject"} request #11` }));
    expect(await screen.findByText(`Request #11 ${decision.toLowerCase()}.`)).toBeInTheDocument();
    expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/requests/11/decision", expect.objectContaining({ method: "PATCH", credentials: "include", body: JSON.stringify(decision === "REJECTED" ? { decision, reason: "Budget limit exceeded" } : { decision }) }));
    expect(screen.queryByText("Travel request")).not.toBeInTheDocument();
  });

  it("TEST-F03-UI-04: shows loading and empty states", async () => {
    const list = deferred<Response>();
    mockApi(async () => list.promise);
    render(<App />);
    expect(await screen.findByText("Loading pending requests…")).toBeInTheDocument();
    await act(async () => { list.resolve(response([])); });
    expect(await screen.findByText("No pending requests assigned to you.")).toBeInTheDocument();
  });

  it("TEST-F03-UI-05: recovers from a pending-list network error through Retry", async () => {
    let attempts = 0;
    mockApi(async () => { if (++attempts === 1) throw new TypeError("Network unavailable"); return response([pending]); });
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load pending requests.");
    await user.click(screen.getByRole("button", { name: "Retry loading requests" }));
    expect(await screen.findByText("Travel request")).toBeInTheDocument();
  });

  it.each([403, 404, 409, 500])("TEST-F03-UI-06: displays a %s decision failure and re-enables actions", async (status) => {
    mockApi(async (_path, init) => init?.method === "PATCH" ? response({ error: `Decision refused (${status}).` }, status) : response([pending]));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Approve request #11" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(`Decision refused (${status}).`);
    expect(screen.getByRole("button", { name: "Approve request #11" })).toBeEnabled();
    expect(screen.queryByText("Request #11 approved.")).not.toBeInTheDocument();
  });

  it("TEST-F03-UI-07: a double click sends one decision while all actions are disabled", async () => {
    const decision = deferred<Response>();
    let saved = false;
    const fetchMock = mockApi(async (_path, init) => {
      if (init?.method === "PATCH") { saved = true; return decision.promise; }
      return response(saved ? [] : [pending]);
    });
    const user = userEvent.setup();
    render(<App />);
    await user.dblClick(await screen.findByRole("button", { name: "Approve request #11" }));
    expect(screen.getByRole("button", { name: "Reject request #11" })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
    await act(async () => { decision.resolve(response({ ...pending, status: "APPROVED" })); });
    expect(await screen.findByText("Request #11 approved.")).toBeInTheDocument();
  });

  it("TEST-F03-UI-08: distinguishes a saved decision from a failed list refresh", async () => {
    let saved = false;
    mockApi(async (_path, init) => {
      if (init?.method === "PATCH") { saved = true; return response({ ...pending, status: "APPROVED" }); }
      if (saved) throw new TypeError("Refresh unavailable");
      return response([pending]);
    });
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Approve request #11" }));
    expect(await screen.findByText("Request #11 approved.")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load pending requests.");
    expect(screen.queryByRole("button", { name: "Approve request #11" })).not.toBeInTheDocument();
  });

  it("TEST-F03-UI-09: signs out from the Reviewer workspace", async () => {
    mockApi(async () => response([pending]));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Travel request");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument());
    expect(screen.queryByText("Travel request")).not.toBeInTheDocument();
  });

  it("TEST-DEF-001-REVIEWER: wraps long request titles and descriptions", async () => {
  const longTitle = "X".repeat(150);
  const longDescription = "X".repeat(300);

  mockApi(async () =>
    response([{ ...pending, title: longTitle, description: longDescription }])
  );

  render(<ReviewerWorkspace />);

  const titleElement = await screen.findByText(longTitle);
  const descriptionElement = screen.getByText(longDescription);

  expect(window.getComputedStyle(titleElement).overflowWrap).toBe("anywhere");
  expect(window.getComputedStyle(descriptionElement).overflowWrap).toBe("anywhere");
});
});
