import { useEffect, useRef, useState } from "react";

type PendingRequest = {
  id: number;
  title: string;
  description: string;
  createdAt: string;
};

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error : fallback;
}

export default function ReviewerWorkspace() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const busy = useRef(false);
  const active = useRef(false);
  const loadGeneration = useRef(0);

  async function loadPending() {
    const generation = ++loadGeneration.current;
    const isCurrent = () => active.current && generation === loadGeneration.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/requests/pending", { credentials: "include" });
      if (!response.ok) throw new Error(await errorMessage(response, "Could not load pending requests."));
      const items: PendingRequest[] = await response.json();
      if (isCurrent()) setRequests(items);
    } catch (caught) {
      if (isCurrent()) setError(caught instanceof TypeError ? "Could not load pending requests." : caught instanceof Error ? caught.message : "Could not load pending requests.");
    } finally { if (isCurrent()) setLoading(false); }
  }

  useEffect(() => {
    active.current = true;
    void loadPending();
    return () => { active.current = false; loadGeneration.current++; };
  }, []);

  async function decide(id: number, decision: "APPROVED" | "REJECTED") {
    if (busy.current) return;
    busy.current = true;
    // A response started before this mutation must not restore old rows, errors,
    // or loading state, even when StrictMode replays the initial effect.
    loadGeneration.current++;
    setLoading(false);
    setProcessing(id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/requests/${id}/decision`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) throw new Error(await errorMessage(response, "Could not save the decision."));
      if (!active.current) return;
      // Saving and refreshing are distinct outcomes. Do not offer a second
      // decision or report a failed save if the subsequent GET fails.
      setSuccess(`Request #${id} ${decision.toLowerCase()}.`);
      setRequests((items) => items.filter((item) => item.id !== id));
      await loadPending();
    } catch (caught) {
      if (active.current) setError(caught instanceof TypeError ? "Could not save the decision." : caught instanceof Error ? caught.message : "Could not save the decision.");
    } finally {
      busy.current = false;
      if (active.current) setProcessing(null);
    }
  }

  return (
    <section className="card" aria-labelledby="pending-heading">
      <h2 id="pending-heading">Assigned pending requests</h2>
      {success && <p className="success" role="status">{success}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="secondary" type="button" disabled={loading || processing !== null} onClick={() => void loadPending()}>
        {error ? "Retry loading requests" : "Refresh pending requests"}
      </button>
      {loading ? <p role="status">Loading pending requests…</p> : requests.length === 0 && !error ? (
        <p className="muted">No pending requests assigned to you.</p>
      ) : (
        <ul className="request-list">
          {requests.map((item) => (
            <li key={item.id}>
              <h3>#{item.id} <span className="request-title">{item.title}</span></h3>
              <p className="request-description">{item.description}</p>
              <p><small>Submitted {new Date(item.createdAt).toLocaleString()}</small></p>
              <div className="review-actions">
                <button type="button" aria-label={`Approve request #${item.id}`} disabled={processing !== null || loading} onClick={() => void decide(item.id, "APPROVED")}>Approve</button>
                <button type="button" className="secondary" aria-label={`Reject request #${item.id}`} disabled={processing !== null || loading} onClick={() => void decide(item.id, "REJECTED")}>Reject</button>
                {processing === item.id && <span role="status">Saving decision…</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
