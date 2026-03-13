// api.js — all API calls in one place
// In development: talks to localhost:8000
// In production: talks to your Railway backend URL
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// ── Token helpers ────────────────────────────
export const token = {
  get: () => localStorage.getItem("applybot_token"),
  set: (t) => localStorage.setItem("applybot_token", t),
  clear: () => localStorage.removeItem("applybot_token"),
};

// ── Base fetch with auth header ─────────────
async function apiFetch(path, options = {}) {
  const t = token.get();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Token ${t}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {

  // ── Auth ────────────────────────────────
  async register(name, email, password) {
    const data = await apiFetch("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    token.set(data.token);
    return data.user;
  },

  async login(email, password) {
    const data = await apiFetch("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    token.set(data.token);
    return data.user;
  },

  async logout() {
    await apiFetch("/auth/logout/", { method: "POST" }).catch(() => {});
    token.clear();
  },

  async getMe() {
    return apiFetch("/auth/me/");
  },

  // ── Resume ──────────────────────────────
  async uploadResume(file) {
    const form = new FormData();
    form.append("resume", file);
    const t = token.get();
    const res = await fetch(`${BASE}/resume/`, {
      method: "POST",
      headers: t ? { Authorization: `Token ${t}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getResume() {
    return apiFetch("/resume/");
  },

  // ── Jobs ────────────────────────────────
  async getJobs(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/jobs/?${params}`);
  },

  async updateJobStatus(jobId, status) {
    return apiFetch(`/jobs/${jobId}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // ── Stats ───────────────────────────────
  async getStats() {
    return apiFetch("/stats/");
  },

  // ── Pipeline ────────────────────────────
  async runPipeline() {
    return apiFetch("/pipeline/run/", { method: "POST" });
  },

  async getPipelineStatus(runId) {
    return apiFetch(`/pipeline/status/${runId}/`);
  },

  // ── Payments ────────────────────────────
  async createOrder(plan) {
    return apiFetch("/payment/create-order/", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
  },

  async verifyPayment(data) {
    return apiFetch("/payment/verify/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getSubscription() {
    return apiFetch("/payment/subscription/");
  },
};
