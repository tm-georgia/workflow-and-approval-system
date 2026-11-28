import { useState, type FormEvent } from "react";
import type { RequestItem } from "./App";

type Props = { request: RequestItem; onSaved: (saved: RequestItem) => void };

export default function ReturnedRequestForm({ request, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim() || !description.trim()) {
      setError("Enter both a title and description.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/requests/${request.id}/resubmit`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not resubmit the request.");
      }
      onSaved(await response.json());
    } catch (caught) {
      setError(caught instanceof Error && !(caught instanceof TypeError) ? caught.message : "Could not resubmit the request.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) return <button type="button" onClick={() => setEditing(true)}>Edit and resubmit</button>;
  return (
    <form className="form" aria-label={`Revise request #${request.id}`} onSubmit={submit}>
      <label>Revised title<input value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} /></label>
      <label>Revised description<textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? "Resubmitting…" : "Resubmit request"}</button>
    </form>
  );
}
