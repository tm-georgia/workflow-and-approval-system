import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

it("F05-T08 returns, corrects and resubmits through both workspaces while retaining failed drafts", async () => {
  const user = userEvent.setup();
  let role = "REVIEWER";
  let returnAttempts = 0;
  let editAttempts = 0;
  const reason = "Please include an itemized cost breakdown in the description";
  const revised = { title: "Revised desks", description: "Two desks at 150 each, total 300." };
  let item = {
    id: 7, title: "Desks", description: "Office desks", status: "PENDING",
    createdAt: "2026-11-28T01:00:00Z", history: [] as { id: number; action: string; reason: string | null }[],
  };
  const json = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body }) as Response;
  vi.stubGlobal("fetch", vi.fn(async (path, options) => {
    if (path === "/api/auth/me") return json({ id: role === "REVIEWER" ? 2 : 1, email: "user@example.test", role });
    if (path === "/api/requests/pending") return json(item.status === "PENDING" ? [item] : []);
    if (path === "/api/requests/mine") return json([item]);
    if (path === "/api/requests/7/decision" && options?.method === "PATCH") {
      expect(JSON.parse(options.body)).toEqual({ decision: "RETURNED", reason });
      if (++returnAttempts === 1) return json({ error: "Return failed." }, 500);
      item = { ...item, status: "RETURNED", history: [{ id: 1, action: "RETURNED", reason }] };
      return json(item);
    }
    if (path === "/api/requests/7/resubmit" && options?.method === "PATCH") {
      expect(JSON.parse(options.body)).toEqual(revised);
      if (++editAttempts === 1) return json({ error: "Resubmission failed." }, 500);
      item = { ...item, ...revised, status: "PENDING", history: [...item.history, { id: 2, action: "RESUBMITTED", reason: null }] };
      return json(item);
    }
    return json({});
  }));

  const reviewer = render(<App />);
  const sendBack = await screen.findByRole("button", { name: "Return request #7 for changes" });
  await user.click(sendBack);
  expect(screen.getByRole("alert")).toHaveTextContent("Provide a reason for return.");
  expect(returnAttempts).toBe(0);
  const field = screen.getByRole("textbox", { name: "Reason for approval, rejection, or return of request #7" });
  await user.click(field);
  await user.paste(reason);
  await user.click(sendBack);
  expect(await screen.findByText("Return failed.")).toBeVisible();
  expect(field).toHaveValue(reason);
  await user.click(sendBack);
  expect(await screen.findByText("No pending requests assigned to you.")).toBeVisible();
  reviewer.unmount();

  role = "REQUESTER";
  const owner = render(<App />);
  expect(await screen.findByText(reason)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Edit and resubmit" }));
  const title = screen.getByLabelText("Revised title");
  const description = screen.getByLabelText("Revised description");
  expect(title).toHaveValue("Desks");
  expect(description).toHaveValue("Office desks");
  await user.clear(title);
  const submit = screen.getByRole("button", { name: "Resubmit request" });
  await user.click(submit);
  expect(screen.getByRole("alert")).toHaveTextContent("Enter both a title and description.");
  expect(editAttempts).toBe(0);
  await user.click(title);
  await user.paste(revised.title);
  await user.clear(description);
  await user.paste(revised.description);
  await user.click(submit);
  expect(await screen.findByText("Resubmission failed.")).toBeVisible();
  expect(title).toHaveValue(revised.title);
  expect(description).toHaveValue(revised.description);
  await user.click(submit);
  expect(await screen.findByText("PENDING")).toBeVisible();
  expect(screen.getByText(reason)).toBeVisible();
  expect(screen.getByText("Resubmitted")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Edit and resubmit" })).toBeNull();
  owner.unmount();

  role = "REVIEWER";
  render(<App />);
  expect(await screen.findByText(revised.title)).toBeVisible();
  expect(screen.getByText(revised.description)).toBeVisible();
});
