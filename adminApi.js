const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    const error = new Error(body?.message || "Admin request failed");
    error.status = response.status;
    throw error;
  }
  return body;
}

export const adminApi = {
  getAvailability: (token, query = "") => request(`/admin/availability${query}`, {}, token),
  createAvailability: (token, data) => request("/admin/availability", { method: "POST", body: JSON.stringify(data) }, token),
  updateAvailability: (token, id, data) => request(`/admin/availability/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deleteAvailability: (token, id) => request(`/admin/availability/${encodeURIComponent(id)}`, { method: "DELETE" }, token),
  getBookings: (token) => request("/admin/bookings", {}, token),
  updateBooking: (token, id, data) => request(`/admin/bookings/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  archiveBooking: (token, id) => request(`/admin/bookings/${encodeURIComponent(id)}/archive`, { method: "POST" }, token),
  deleteBooking: (token, id) => request(`/admin/bookings/${encodeURIComponent(id)}`, { method: "DELETE" }, token),
  deleteArchived: (token, id) => request(`/admin/archived-bookings/${encodeURIComponent(id)}/delete`, { method: "POST" }, token),
  cleanup: (token, beforeDate) => request("/admin/bookings/cleanup", { method: "POST", body: JSON.stringify({ beforeDate, archive: true }) }, token),
  bulkArchive: (token, ids) => request("/admin/bookings/bulk-archive", { method: "POST", body: JSON.stringify({ ids }) }, token),
  bulkDelete: (token, ids) => request("/admin/bookings/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }, token),
};
