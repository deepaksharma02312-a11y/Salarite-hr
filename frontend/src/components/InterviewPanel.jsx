import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatRange, initials } from "../utils.js";
import { ChatIcon, DotsIcon, PhoneIcon, VideoIcon } from "./Icons.jsx";

const MODES = { voice: "Voice call", video: "Video call", chat: "Chat" };
const MODE_OPTIONS = [
  { key: "voice", label: "Voice", icon: <PhoneIcon /> },
  { key: "video", label: "Video", icon: <VideoIcon /> },
  { key: "chat", label: "Chat", icon: <ChatIcon /> },
];
const STATUS_LABEL = { scheduled: "Scheduled", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };

/* ---------- HR: upcoming interview cards ---------- */
export function UpcomingInterviews({ interviews, onChanged }) {
  const [session, setSession] = useState(null); // placeholder call modal
  const [error, setError] = useState("");
  const upcoming = interviews.filter((i) => i.status === "scheduled" || i.status === "in_progress");

  async function start(id) {
    setError("");
    try {
      setSession(await api.startCall(id));
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setStatus(id, status) {
    setError("");
    try {
      await api.updateInterview(id, status);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="side-head">
        <h2>Upcoming interviews</h2>
        <span className="dots"><DotsIcon /></span>
      </div>
      {error && <div className="alert">{error}</div>}
      {upcoming.length === 0 ? (
        <p className="empty">No upcoming interviews. Schedule one below.</p>
      ) : (
        <div className="iv-grid">
          {upcoming.map((i) => (
            <div className="iv-card" key={i.id}>
              <div className="iv-avatar">{initials(i.candidate_name)}</div>
              <strong>{i.candidate_name}</strong>
              <span className="iv-meta">
                {formatRange(i.scheduled_at, i.ends_at)}
                <br />
                {MODES[i.mode]}
                {i.employer_name ? ` · for ${i.employer_name}` : ""}
              </span>
              <button className={`btn ${i.status === "in_progress" ? "outline" : "primary"} block small`} onClick={() => start(i.id)}>
                {i.status === "in_progress" ? "Rejoin" : "Start"}
              </button>
              <button className="link" onClick={() => setStatus(i.id, i.status === "in_progress" ? "completed" : "cancelled")}>
                {i.status === "in_progress" ? "Mark done" : "Cancel"}
              </button>
            </div>
          ))}
        </div>
      )}
      {session && <CallModal session={session} onClose={() => setSession(null)} />}
    </section>
  );
}

/* ---------- Employer: view only list ---------- */
export function InterviewList({ interviews }) {
  return (
    <section>
      <div className="side-head">
        <h2>Interviews</h2>
        <span className="muted small-text">View only</span>
      </div>
      {interviews.length === 0 ? (
        <p className="empty">No interviews scheduled for you yet.</p>
      ) : (
        <div className="iv-rows">
          {interviews.map((i) => (
            <div className="iv-row" key={i.id}>
              <div>
                <strong>{i.candidate_name}</strong>
                <span>
                  {formatRange(i.scheduled_at, i.ends_at)} · {MODES[i.mode]}
                  {i.created_by_name ? ` · by ${i.created_by_name}` : ""}
                </span>
              </div>
              <span className={`tag st-${i.status}`}>{STATUS_LABEL[i.status]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- HR: schedule form ---------- */
export function InterviewForm({ onCreated }) {
  const [employers, setEmployers] = useState(null); // null = abhi load ho raha hai
  const [employerId, setEmployerId] = useState(null);
  const [candidate, setCandidate] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [mode, setMode] = useState("voice");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadEmployers() {
    try {
      setEmployers(await api.getEmployers());
    } catch (err) {
      setEmployers([]);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadEmployers();
  }, []);

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const timesOk = start && end && end > start;
  const ready = employerId && candidate.trim() && date && timesOk;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createInterview({
        employer_id: employerId,
        candidate_name: candidate.trim(),
        candidate_email: email.trim(),
        // Local time ko UTC me badalkar bhejte hain
        scheduled_at: new Date(`${date}T${start}`).toISOString(),
        ends_at: new Date(`${date}T${end}`).toISOString(),
        mode,
      });
      setCandidate("");
      setEmail("");
      setDate("");
      setStart("");
      setEnd("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Schedule an interview</h2>

      <div>
        <div className="field-label with-action">
          <span>For employer</span>
          <button type="button" className="link" onClick={loadEmployers}>Refresh list</button>
        </div>
        {employers === null ? (
          <p className="empty">Loading employer list...</p>
        ) : employers.length === 0 ? (
          <p className="empty">No employer accounts yet.</p>
        ) : (
          <div className="hr-list" role="group" aria-label="Choose an employer">
            {employers.map((emp) => (
              <button
                type="button"
                key={emp.id}
                className={`hr-row ${employerId === emp.id ? "on" : ""}`}
                aria-pressed={employerId === emp.id}
                onClick={() => setEmployerId(emp.id)}
              >
                <span className="hr-avatar">{initials(emp.username)}</span>
                <span className="hr-name">{emp.username}</span>
                <span className="hr-role">Employer</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <label>
        Candidate name
        <input value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="Rahul Sharma" required />
      </label>
      <label>
        Candidate email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@example.com" />
      </label>
      <label>
        Date
        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <div className="two">
        <label>
          Start time
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label>
          End time
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </label>
      </div>
      {start && end && !timesOk && <div className="alert">End time must be after start time.</div>}

      <div>
        <div className="field-label">Meeting type</div>
        <div className="seg icons">
          {MODE_OPTIONS.map((m) => (
            <button type="button" key={m.key} className={mode === m.key ? "on" : ""} aria-pressed={mode === m.key} onClick={() => setMode(m.key)}>
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="alert">{error}</div>}
      <button className="btn primary block" disabled={busy || !ready}>
        {busy ? "Scheduling..." : "Schedule interview"}
      </button>
    </form>
  );
}

function CallModal({ session, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{MODES[session.mode]} session</h2>
        <p className="room">{session.room_id}</p>
        <p className="muted">{session.message}</p>
        <button className="btn primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
