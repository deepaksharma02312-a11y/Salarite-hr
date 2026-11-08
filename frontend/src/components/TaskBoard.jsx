import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { timeAgo } from "../utils.js";
import { DotsIcon } from "./Icons.jsx";
import EditTaskModal from "./EditTaskModal.jsx";

const COLUMNS = [
  { key: "pending", title: "Pending" },
  { key: "in_progress", title: "In progress" },
  { key: "completed", title: "Completed" },
];
const STATUS_LABEL = { pending: "Pending", in_progress: "In progress", completed: "Completed" };
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High" };

export default function TaskBoard({ tasks, role, filter, onChanged }) {
  // Filter laga ho to sirf wahi column dikhao
  const visible = filter === "all" ? COLUMNS : COLUMNS.filter((c) => c.key === filter);

  return (
    <div className={`board ${filter === "all" ? "" : "single"}`}>
      {visible.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div className="column" key={col.key}>
            <div className="column-head">
              <span>{col.title}</span>
              <em>{items.length}</em>
            </div>
            {items.length === 0 && <p className="empty">No tasks here.</p>}
            <div className="column-cards">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} role={role} onChanged={onChanged} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, role, onChanged }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editOpen, setEditOpen] = useState(false); // employer ka edit / reassign popup
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  // Menu ke bahar click karne pe band ho jaye
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  async function run(fn) {
    setError("");
    setMenuOpen(false);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  const moveTo = (status) => run(() => api.updateTask(task.id, status, task.hr_note));
  const remove = () => window.confirm("Delete this task?") && run(() => api.deleteTask(task.id));
  const saveNote = () =>
    run(async () => {
      await api.updateTask(task.id, task.status, draft.trim());
      setEditing(false);
    });

  return (
    <article className={`task s-${task.status}`}>
      <div className="task-top">
        <h4>{task.title}</h4>
        <div className="kebab-wrap" ref={wrapRef}>
          <button
            type="button"
            className="kebab"
            aria-label="Task actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              {role === "hr" ? (
                <>
                  {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                    <button key={c.key} role="menuitem" type="button" onClick={() => moveTo(c.key)}>
                      Move to {STATUS_LABEL[c.key]}
                    </button>
                  ))}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setDraft(task.hr_note || "");
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    {task.hr_note ? "Edit note" : "Add note"}
                  </button>
                </>
              ) : (
                <>
                  {task.status !== "completed" && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setEditOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      Edit / reassign
                    </button>
                  )}
                  <button role="menuitem" type="button" className="danger" onClick={remove}>
                    Delete task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="who-line">
        {role === "employer" ? (
          <>Assigned to <strong>{task.assigned_to_name || "Unknown"}</strong></>
        ) : (
          <>From <strong>{task.created_by_name || "Unknown"}</strong></>
        )}
      </div>

      {editing ? (
        <div className="note-edit">
          <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What has been done so far?" autoFocus />
          <div className="note-actions">
            <button type="button" className="btn primary small" onClick={saveNote}>Save note</button>
            <button type="button" className="btn outline small" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : task.hr_note ? (
        <div className="note"><strong>HR note:</strong> {task.hr_note}</div>
      ) : role === "employer" && task.status !== "completed" ? (
        <div className="note muted">No update from HR yet</div>
      ) : null}

      <div className="task-foot">
        <span className={`tag ${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
        <span className="when">Updated {timeAgo(task.updated_at)}</span>
      </div>
      {error && <div className="alert">{error}</div>}
      {editOpen && <EditTaskModal task={task} onClose={() => setEditOpen(false)} onSaved={onChanged} />}
    </article>
  );
}
