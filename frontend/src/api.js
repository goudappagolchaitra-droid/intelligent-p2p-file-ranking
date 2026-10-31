
// const API_BASE_URL = "http://127.0.0.1:8000";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function getPeers() {
  const response = await fetch(`${API_BASE_URL}/peers`);

  if (!response.ok) {
    throw new Error("Failed to fetch peers");
  }

  return response.json();
}

export async function getPeerRanking() {
  const response = await fetch(`${API_BASE_URL}/peers/ranking`);

  if (!response.ok) {
    throw new Error("Failed to fetch peer rankings");
  }

  return response.json();
}

export async function registerPeer(peerData) {
  const response = await fetch(`${API_BASE_URL}/peers/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(peerData),
  });

  if (!response.ok) {
    throw new Error("Failed to register peer");
  }

  return response.json();
}
