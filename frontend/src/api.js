// Backend se baat karne ka ek hi jagah. Baaki components sirf in functions ko call karte hain.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");
export const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
export const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      clearSession();
      window.location.reload();
    }
    // FastAPI validation error list ho sakti hai
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(", ")
      : data.detail;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
  register: (username, password, role) => request("/auth/register", { method: "POST", body: { username, password, role } }),

  getHrs: () => request("/users/hrs"),
  getEmployers: () => request("/users/employers"),

  getTasks: () => request("/tasks"),
  createTask: (task) => request("/tasks", { method: "POST", body: task }),
  updateTask: (id, status, hr_note) => request(`/tasks/${id}`, { method: "PATCH", body: { status, hr_note } }),
  editTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: data }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  getInterviews: () => request("/interviews"),
  createInterview: (data) => request("/interviews", { method: "POST", body: data }),
  updateInterview: (id, status) => request(`/interviews/${id}`, { method: "PATCH", body: { status } }),
  startCall: (id) => request(`/interviews/${id}/start`, { method: "POST" }),
};
