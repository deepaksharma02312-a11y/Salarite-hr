import Logo from "./Logo.jsx";
import Dropdown from "./Dropdown.jsx";
import { BellIcon, SearchIcon } from "./Icons.jsx";
import { agoMs, timeAgo } from "../utils.js";

const STATE_LABEL = { live: "Live", paused: "Paused", offline: "Offline" };

export default function Header({ greeting, user, avatar, query, onQuery, onLogout, notifications, unread, onOpenNotifications, status }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Logo />
        <span className="divider" />
        <span className="greeting">{greeting}</span>
      </div>

      <label className="search">
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" />
        <SearchIcon />
      </label>

      <div className="topbar-right">
        {/* Notifications */}
        <Dropdown
          label="Notifications"
          className="icon-btn"
          onOpen={onOpenNotifications}
          trigger={
            <>
              <BellIcon />
              {unread > 0 && <span className="badge">{unread > 9 ? "9+" : unread}</span>}
            </>
          }
        >
          <div className="dd-title">Notifications</div>
          {notifications.length === 0 ? (
            <p className="dd-text">No notifications yet.</p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n) => (
                <li key={n.id} className={n.fresh ? "fresh" : ""}>
                  <strong>{n.text}</strong>
                  {n.detail && <span>{n.detail}</span>}
                  <time>{timeAgo(n.time.toISOString())}</time>
                </li>
              ))}
            </ul>
          )}
        </Dropdown>

        {/* Live status */}
        <Dropdown
          label="Live updates"
          className={`live ${status.state}`}
          trigger={
            <>
              <i />
              {STATE_LABEL[status.state]}
            </>
          }
        >
          {(close) => (
            <>
              <div className="dd-title">Live updates</div>
              <p className="dd-text">
                {status.state === "offline"
                  ? `Cannot reach the server. ${status.error}`
                  : status.state === "paused"
                  ? "Auto-refresh is paused."
                  : "Refreshing automatically every 3 seconds."}
              </p>
              <p className="dd-text muted">Last updated: {status.updatedAt ? agoMs(status.updatedAt) : "never"}</p>
              <button type="button" className="dd-item" onClick={status.onRefresh}>Refresh now</button>
              <button
                type="button"
                className="dd-item"
                onClick={() => {
                  status.onToggle();
                  close();
                }}
              >
                {status.state === "paused" ? "Resume live updates" : "Pause live updates"}
              </button>
            </>
          )}
        </Dropdown>

        {/* Profile */}
        <Dropdown label="Profile" className="avatar" trigger={avatar}>
          <div className="profile">
            <span className="avatar big">{avatar}</span>
            <div>
              <strong>{user.username}</strong>
              <span>{user.role === "hr" ? "Virtual HR" : "Employer"}</span>
            </div>
          </div>
          <button type="button" className="dd-item danger" onClick={onLogout}>Log out</button>
        </Dropdown>

        <button className="btn outline" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
