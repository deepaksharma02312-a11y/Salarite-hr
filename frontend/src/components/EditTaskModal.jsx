import { useEffect, useState } from "react";
import { api } from "../api.js";
import { initials } from "../utils.js";

const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

// Employer ka popup: task badlo ya dusre HR ko do (jab tak task completed na ho)
export default function EditTaskModal({ task, onClose, onSaved }) {
  const [hrs, setHrs] = useState(null);
  const [hrId, setHrId] = useState(task.assigned_to_id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getHrs().then(setHrs).catch((err) => {
      setHrs([]);
      setError(err.message);
    });
  }, []);

  const changedHr = hrId !== task.assigned_to_id;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.editTask(task.id, { title: title.trim(), description: description.trim(), priority, assigned_to_id: hrId });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal panel wide form" role="dialog" aria-modal="true" onSubmit={save} onClick={(e) => e.stopPropagation()}>
        <h2>Edit task</h2>

        <div>
          <div className="field-label">Assigned to</div>
          {hrs === null ? (
            <p className="empty">Loading HR list...</p>
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
                  <span className="hr-role">{h.id === task.assigned_to_id ? "Current" : "Virtual HR"}</span>
                </button>
              ))}
            </div>
          )}
          {changedHr && (
            <p className="hint-warn">Moving this task to another HR resets its status to Pending and clears the HR note.</p>
          )}
        </div>

        <label>
          Task title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Details
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div>
          <div className="field-label">Priority</div>
          <div className="seg">
            {PRIORITIES.map((p) => (
              <button type="button" key={p.key} className={priority === p.key ? "on" : ""} aria-pressed={priority === p.key} onClick={() => setPriority(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy || !title.trim() || !hrId}>{busy ? "Saving..." : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}
