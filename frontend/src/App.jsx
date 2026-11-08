import { useState } from "react";
import { api, clearSession, getSavedUser, getToken } from "./api.js";
import { usePolling } from "./usePolling.js";
import { formatRange, toDate } from "./utils.js";
import Login from "./components/Login.jsx";
import Header from "./components/Header.jsx";
import StatCards from "./components/StatCards.jsx";
import TaskBoard from "./components/TaskBoard.jsx";
import TaskForm from "./components/TaskForm.jsx";
import { InterviewForm, InterviewList, UpcomingInterviews } from "./components/InterviewPanel.jsx";

const FILTER_LABEL = { pending: "Pending", in_progress: "In progress", completed: "Completed" };

export default function App() {
  const [user, setUser] = useState(getToken() ? getSavedUser() : null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        clearSession();
        setUser(null);
      }}
    />
  );
}

// Tasks aur interviews ke data se notifications banata hai (alag backend ki zaroorat nahi)
function buildNotifications(role, tasks, interviews) {
  const events = [];
  if (role === "hr") {
    tasks.forEach((t) =>
      events.push({
        id: `t${t.id}-${t.assigned_at || t.created_at}`,
        time: toDate(t.assigned_at || t.created_at),
        text: `New task from ${t.created_by_name || "an employer"}`,
        detail: t.title,
      })
    );
  } else {
    tasks.forEach((t) => {
      // updated_at created_at se alag hai matlab HR ne kuch badla hai
      if (toDate(t.updated_at) - toDate(t.created_at) > 1000 && (t.status !== "pending" || t.hr_note)) {
        events.push({
          id: `t${t.id}-${t.updated_at}`,
          time: toDate(t.updated_at),
          text: `${t.assigned_to_name || "HR"} updated "${t.title}"`,
          detail: `${FILTER_LABEL[t.status]}${t.hr_note ? ` · ${t.hr_note}` : ""}`,
        });
      }
    });
    interviews.forEach((i) =>
      events.push({
        id: `i${i.id}-new`,
        time: toDate(i.created_at),
        text: "Interview scheduled",
        detail: `${i.candidate_name} · ${formatRange(i.scheduled_at, i.ends_at)}${i.created_by_name ? ` · by ${i.created_by_name}` : ""}`,
      })
    );
  }
  return events.sort((a, b) => b.time - a.time).slice(0, 10);
}

function Dashboard({ user, onLogout }) {
  const isEmployer = user.role === "employer";

  const [liveOn, setLiveOn] = useState(true); // Live menu se pause/resume
  // Dono list har 3 second me refresh hoti hain (real-time visibility)
  const tasks = usePolling(api.getTasks, 3000, liveOn);
  const interviews = usePolling(api.getInterviews, 3000, liveOn);

  const [filter, setFilter] = useState("all"); // all | pending | in_progress | completed
  const [query, setQuery] = useState("");

  // ---- Notifications: "last seen" browser me save hota hai ----
  const seenKey = `seen_${user.username}`;
  const [seen, setSeen] = useState(() => {
    const saved = Number(localStorage.getItem(seenKey));
    if (saved) return saved;
    const now = Date.now();
    localStorage.setItem(seenKey, String(now));
    return now;
  });
  const [highlightFrom, setHighlightFrom] = useState(seen);

  const all = tasks.data || [];
  const notifications = buildNotifications(user.role, all, interviews.data || []).map((n) => ({
    ...n,
    fresh: n.time.getTime() > highlightFrom,
  }));
  const unread = notifications.filter((n) => n.time.getTime() > seen).length;

  function openNotifications() {
    setHighlightFrom(seen); // purane "seen" se naye wale highlight honge
    const now = Date.now();
    setSeen(now);
    localStorage.setItem(seenKey, String(now));
  }

  const status = {
    state: tasks.error ? "offline" : liveOn ? "live" : "paused",
    error: tasks.error,
    updatedAt: tasks.updatedAt,
    onRefresh: () => {
      tasks.reload();
      interviews.reload();
    },
    onToggle: () => setLiveOn((v) => !v),
  };

  const counts = {
    all: all.length,
    pending: all.filter((t) => t.status === "pending").length,
    in_progress: all.filter((t) => t.status === "in_progress").length,
    completed: all.filter((t) => t.status === "completed").length,
  };

  // Search sirf board ko filter karta hai, upar ke numbers nahi badalte
  const q = query.trim().toLowerCase();
  const shown = q
    ? all.filter((t) => `${t.title} ${t.description} ${t.hr_note} ${t.assigned_to_name || ""} ${t.created_by_name || ""}`.toLowerCase().includes(q))
    : all;

  return (
    <div className="shell">
      <Header
        greeting={`Welcome back, ${isEmployer ? "Employer" : "HR"}`}
        user={user}
        avatar={isEmployer ? "EM" : "HR"}
        query={query}
        onQuery={setQuery}
        onLogout={onLogout}
        notifications={notifications}
        unread={unread}
        onOpenNotifications={openNotifications}
        status={status}
      />

      <div className="layout">
        <main className="main">
          {tasks.error && <div className="alert">Cannot reach the server: {tasks.error}</div>}

          <StatCards counts={counts} filter={filter} onSelect={setFilter} />

          <section className="panel board-panel">
            <div className="panel-head">
              <div>
                <h2>Task board</h2>
                <p className="sub">
                  {isEmployer ? "Updates automatically as your Virtual HR works" : "Use the menu on a task to change its status or add a note"}
                </p>
              </div>
              {filter !== "all" && (
                <button className="filter-chip" onClick={() => setFilter("all")}>
                  Showing {FILTER_LABEL[filter]} · Clear filter
                </button>
              )}
            </div>
            <TaskBoard tasks={shown} role={user.role} filter={filter} onChanged={tasks.reload} />
          </section>
        </main>

        <aside className="side">
          {isEmployer ? (
            <>
              <TaskForm onCreated={tasks.reload} />
              <InterviewList interviews={interviews.data || []} />
            </>
          ) : (
            <>
              <UpcomingInterviews interviews={interviews.data || []} onChanged={interviews.reload} />
              <InterviewForm onCreated={interviews.reload} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
