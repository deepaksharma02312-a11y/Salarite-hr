import { useState } from "react";
import { api, saveSession } from "../api.js";
import Logo from "./Logo.jsx";

const DEMO = [
  { label: "Employer", username: "employer", password: "employer123" },
  { label: "Virtual HR", username: "hr", password: "hr123456" },
];

const ROLES = [
  { key: "employer", title: "Employer", text: "Assign tasks, track progress" },
  { key: "hr", title: "Virtual HR", text: "Update tasks, run interviews" },
];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" ya "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("employer");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const longEnough = password.length >= 8;
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = isSignup
    ? username.trim().length >= 3 && longEnough && matches
    : username.trim() && password;

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token, user } = isSignup
        ? await api.register(username.trim(), password, role)
        : await api.login(username.trim(), password);
      saveSession(token, user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <Logo light size={44} />
        <div>
          <h1>Hire faster with your Virtual HR</h1>
          <p>Assign tasks, track progress live and schedule interviews, all in one place.</p>
          <ul>
            <li>Live task board for employers</li>
            <li>One-click interview scheduling</li>
            <li>Voice, video and chat sessions</li>
          </ul>
        </div>
        <small>Salarite Virtual HR dashboard</small>
      </section>

      <section className="login-side">
        <form className="login-card" onSubmit={submit}>
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">
            {isSignup ? "Choose your role and set a password." : "Sign in to continue to your dashboard."}
          </p>

          {isSignup && (
            <div>
              <div className="field-label">I am an</div>
              <div className="role-pick">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.key}
                    className={role === r.key ? "on" : ""}
                    aria-pressed={role === r.key}
                    onClick={() => setRole(r.key)}
                  >
                    <strong>{r.title}</strong>
                    <span>{r.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
            {isSignup && <span className="field-hint">3 to 30 characters: letters, numbers or underscore</span>}
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
          </label>

          {isSignup && (
            <>
              <label>
                Confirm password
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <ul className="pw-rules">
                <li className={longEnough ? "ok" : ""}>At least 8 characters</li>
                <li className={matches ? "ok" : ""}>Both passwords match</li>
              </ul>
            </>
          )}

          {error && <div className="alert">{error}</div>}

          <button className="btn primary block" disabled={busy || !canSubmit}>
            {busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
          </button>

          {!isSignup && (
            <div className="demo">
              <span>Try a demo account</span>
              <div>
                {DEMO.map((d) => (
                  <button
                    type="button"
                    key={d.username}
                    className="btn outline small"
                    onClick={() => {
                      setUsername(d.username);
                      setPassword(d.password);
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="switch">
            {isSignup ? "Already have an account? " : "New here? "}
            <button type="button" onClick={() => switchMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
