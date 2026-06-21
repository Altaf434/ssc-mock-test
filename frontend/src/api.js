const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listTests: () => request("/tests"),
  getTest: (testId) => request(`/tests/${testId}`),
  getTestStats: (testId) => request(`/tests/${testId}/stats`),
  createUser: (name, state) =>
    request("/users", { method: "POST", body: JSON.stringify({ name, state }) }),
  startAttempt: (userId, testId) =>
    request("/attempts/start", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, test_id: testId }),
    }),
  submitAttempt: (attemptId, answers) =>
    request(`/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getAttempt: (attemptId) => request(`/attempts/${attemptId}`),
};
