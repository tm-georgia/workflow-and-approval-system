import { useEffect, useState, type FormEvent } from "react";
import "./App.css";
import ReviewerWorkspace from "./ReviewerWorkspace";

type User = {
  id: number;
  email: string;
  role: "REQUESTER" | "REVIEWER";
};

type RequestItem = {
  id: number;
  title: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewerId?: number | null;
  decidedAt?: string | null;
};

async function responseError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return data.error ?? "Something went wrong.";
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    const response = await fetch("/api/requests/mine", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await responseError(response));
    }

    setRequests(await response.json());
  }

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const currentUser: User = await response.json();
          setUser(currentUser);

          if (currentUser.role === "REQUESTER") {
            await loadRequests();
          }
        }
      } catch {
        setError("Could not connect to the app. Check that both servers are running.");
      } finally {
        setLoading(false);
      }
    }

    void loadCurrentUser();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      const signedInUser: User = await response.json();
      setUser(signedInUser);

      if (signedInUser.role === "REQUESTER") {
        await loadRequests();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setRequests([]);
    setPassword("");
    setError("");
    setSuccess("");
  }

  async function handleSubmitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error(await responseError(response));
      }

      setTitle("");
      setDescription("");
      setSuccess("Request saved as Pending.");
      await loadRequests();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit request.");
    }
  }

  if (loading) {
    return <main className="page"><p>Loading…</p></main>;
  }

  if (!user) {
    return (
      <main className="page">
        <section className="card">
          <p className="eyebrow">WORKFLOW AND APPROVAL SYSTEM</p>
          <h1>Sign in</h1>
          <p className="muted">Sign in to submit or review a request.</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleLogin} className="form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
  Password
  <div className="password-field">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      required
    />
    <button
      type="button"
      className="secondary"
      onClick={() => setShowPassword((visible) => !visible)}
      aria-pressed={showPassword}
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>
</label>

            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">WORKFLOW AND APPROVAL SYSTEM</p>
          <h1>{user.role === "REQUESTER" ? "My requests" : "Reviewer workspace"}</h1>
        </div>
        <div className="account">
          <span>{user.email} · {user.role}</span>
          <button className="secondary" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}

      {user.role === "REQUESTER" ? (
        <div className="columns">
          <section className="card">
            <h2>Submit a request</h2>
            <p className="muted">Your request will be saved as Pending.</p>

            <form onSubmit={handleSubmitRequest} className="form">
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={5}
                />
              </label>

              <button type="submit">Submit request</button>
            </form>
          </section>

          <section className="card">
            <h2>Request history</h2>
            {requests.length === 0 ? (
              <p className="muted">You haven’t submitted any requests yet.</p>
            ) : (
              <ul className="request-list">
                {requests.map((item) => (
                  <li key={item.id}>
                    <div className="request-heading">
                      <strong>{item.title}</strong>
                      <span className={`status ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </div>
                    <p>{item.description}</p>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                    {item.decidedAt && item.reviewerId != null && (
                      <p><small>Decision by Reviewer #{item.reviewerId} on {new Date(item.decidedAt).toLocaleString()}</small></p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <ReviewerWorkspace key={user.id} />
      )}
    </main>
  );
}

export default App;
