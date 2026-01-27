const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("access_token") || "";
}

export async function http(path, { method = "GET", headers = {}, body, auth = true } = {}) {
  const h = { "Content-Type": "application/json", ...headers };

  if (auth) {
    const token = getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const msg = (data && data.detail) || (typeof data === "string" && data) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
