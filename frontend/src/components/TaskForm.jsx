import { useEffect, useState } from "react";
import { api } from "../api.js";
import { initials } from "../utils.js";

const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

// Sirf employer ko dikhta hai
export default function TaskForm({ onCreated }) {
  const [hrs, setHrs] = useState(null); // null = abhi load ho raha hai
  const [hrId, setHrId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadHrs() {
    try {
      setHrs(await api.getHrs());
    } catch (err) {
      setHrs([]);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHrs();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createTask({ title: title.trim(), description: description.trim(), priority, assigned_to_id: hrId });
      setTitle("");
      setDescription("");
      setPriority("medium");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Assign a task</h2>

      <div>
        <div className="field-label with-action">
          <span>Assign to</span>
          <button type="button" className="link" onClick={loadHrs}>Refresh list</button>
        </div>
        {hrs === null ? (
          <p className="empty">Loading HR list...</p>
        ) : hrs.length === 0 ? (
          <p className="empty">No HR accounts yet. Ask your HR to create an account first.</p>
        ) : (
          <div className="hr-list" role="group" aria-label="Choose an HR">
            {hrs.map((h) => (
              <button
                type="button"
                key={h.id}
                className={`hr-row ${hrId === h.id ? "on" : ""}`}
                aria-pressed={hrId === h.id}
                onClick={() => setHrId(h.id)}
              >
                <span className="hr-avatar">{initials(h.username)}</span>
                <span className="hr-name">{h.username}</span>
                <span className="hr-role">Virtual HR</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <label>
        Task title
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Screen 10 backend resumes" required />
      </label>
      <label>
        Details
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should the Virtual HR do?" />
      </label>
      <div>
        <div className="field-label">Priority</div>
        <div className="seg">
          {PRIORITIES.map((p) => (
            <button
              type="button"
              key={p.key}
              className={priority === p.key ? "on" : ""}
              aria-pressed={priority === p.key}
              onClick={() => setPriority(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <button className="btn primary block" disabled={busy || !title.trim() || !hrId}>
        {busy ? "Assigning..." : "Assign task"}
      </button>
    </form>
  );
}
