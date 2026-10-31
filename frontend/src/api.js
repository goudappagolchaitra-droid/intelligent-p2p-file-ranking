
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Attach the logged-in user's JWT token to API requests.
function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem("peerrank_access_token");

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPeers() {
  const response = await fetch(`${API_BASE_URL}/peers`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch peers");
  }

  return response.json();
}

export async function getPeerRanking() {
  const response = await fetch(`${API_BASE_URL}/peers/ranking`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch peer rankings");
  }

  return response.json();
}

export async function registerPeer(peerData) {
  const response = await fetch(`${API_BASE_URL}/peers/register`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(peerData),
  });

  if (!response.ok) {
    throw new Error("Failed to register peer");
  }

  return response.json();
}
