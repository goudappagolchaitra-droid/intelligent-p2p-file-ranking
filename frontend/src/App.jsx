
import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate
} from "react-router-dom";

import {
  Home,
  Folder,
  Users,
  Trophy,
  Activity,
  Network,
  Settings,
  User,
  LogOut,
  Upload,
  Download,
  ShieldCheck,
  Search,
  RefreshCw,
  FileText,
  Check,
  X,
  Menu
} from "lucide-react";

import "./App.css";

import Landing from "./pages/Landing";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";

// const API = "http://127.0.0.1:8000";
const API =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// ==========================================
// AUTHENTICATED API REQUEST HELPER
// ==========================================
// const [connectionStates, setConnectionStates] = useState({});
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("peerrank_access_token");

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {})
    }
  });
}
// ==========================================
// TRANSFER HISTORY HELPER
// ==========================================

function saveTransfer(fileName, type, sizeBytes = 0, peerId = "Unknown") {
  try {
    const oldTransfers = JSON.parse(
      localStorage.getItem("peerrank_transfers") || "[]"
    );

    const newTransfer = {
      id: Date.now() + Math.random(),
      fileName,
      type,
      sizeBytes,
      peerId,
      date: new Date().toLocaleString(),
      status: "Completed"
    };

    const updatedTransfers = [
      newTransfer,
      ...oldTransfers
    ].slice(0, 100);

    localStorage.setItem(
      "peerrank_transfers",
      JSON.stringify(updatedTransfers)
    );
  } catch (error) {
    console.error("Could not save transfer history:", error);
  }
}

// ==========================================
// REUSABLE BUTTON
// ==========================================

function Button({
  children,
  onClick,
  disabled,
  type = "button"
}) {
  return (
    <button
      type={type}
      className="btn btn-primary"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ==========================================
// PAGE HEADER
// ==========================================

function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action}
    </div>
  );
}

// ==========================================
// SIDEBAR
// ==========================================

function Sidebar() {
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/files", label: "My Files", icon: Folder },
    { to: "/peers", label: "Peers", icon: Users },
    { to: "/ranking", label: "Peer Ranking", icon: Trophy },
    { to: "/transfers", label: "Transfers", icon: Activity },
    { to: "/network", label: "Network Monitor", icon: Network },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <Network size={25} />
        <span>PeerRank</span>
      </div>

      <p className="sidebar-label">WORKSPACE</p>

      <nav>
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="nav-link logout"
          onClick={() => {
            localStorage.removeItem("peerrank_user");
            localStorage.removeItem("peerrank_logged_in");
            localStorage.removeItem("peerrank_access_token");
            window.location.href = "/login";
          }}
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}

// ==========================================
// MAIN LAYOUT
// ==========================================

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">

      {menuOpen && (
        <div className="mobile-menu">
          <Sidebar />
        </div>
      )}

      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      <main className="main-content">

        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu />
          </button>

          <span>
            Intelligent Peer-to-Peer File Ranking System
          </span>

          <span className="connection-status">
            <span className="online-dot" />
            Workspace
          </span>
        </header>

        <div
          className="page-content"
          onClick={() => {
            if (menuOpen) setMenuOpen(false);
          }}
        >
          {children}
        </div>

      </main>
    </div>
  );
}

// ==========================================
// DASHBOARD
// ==========================================

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [filesResponse, peersResponse] = await Promise.all([
  authFetch(`${API}/files`),
  authFetch(`${API}/peers`)
]);

      if (!filesResponse.ok || !peersResponse.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const filesData = await filesResponse.json();
      const peersData = await peersResponse.json();

      setFiles(Array.isArray(filesData) ? filesData : []);

      setPeers(
        Array.isArray(peersData)
          ? peersData
          : peersData.peers || []
      );
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome to your PeerRank workspace."
        action={
          <Button onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={17} />
            Refresh
          </Button>
        }
      />

      <div className="stats-grid">

        <div className="stat-card">
          <Folder />
          <p>Total Files</p>
          <h2>{loading ? "..." : files.length}</h2>
        </div>

        <div className="stat-card">
          <Users />
          <p>Registered Peers</p>
          <h2>{loading ? "..." : peers.length}</h2>
        </div>

        <div className="stat-card">
          <ShieldCheck />
          <p>Integrity System</p>
          <h2>Active</h2>
        </div>

        <div className="stat-card">
          <Network />
          <p>Backend</p>
          <h2>Connected</h2>
        </div>

      </div>

      <section className="panel">
        <h2>About PeerRank</h2>

        <p>
          PeerRank is an intelligent peer-to-peer file ranking system.
          It is designed to discover peers, evaluate their performance,
          manage files and verify file integrity using SHA-256.
        </p>
      </section>
    </>
  );
}

// ==========================================
// MY FILES
// ==========================================

function FilesPage() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(
  localStorage.getItem("peerrank_user") || "{}"
);

const profileImage = localStorage.getItem(
  "peerrank_profile_image"
);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState("");
  const [verificationResults, setVerificationResults] = useState({});

  function formatSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  // LOAD FILES

  async function loadFiles() {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(`${API}/files`);
      const response = await authFetch(`${API}/files`);

      if (!response.ok) {
        throw new Error("Could not load files from backend.");
      }

      const data = await response.json();

      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  // UPLOAD FILES

  async function handleUpload(e) {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) return;

    setUploading(true);
    setMessage("");
    setError("");

    let successfulUploads = 0;

    try {
      for (const selectedFile of selectedFiles) {
        const formData = new FormData();

        formData.append("file", selectedFile);
        formData.append("peer_id", "");

        // const response = await fetch(`${API}/files/upload`, {
        const response = await authFetch(`${API}/files/upload`, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Upload failed.");
        }

        successfulUploads++;

        // Save successful upload in transfer history
        saveTransfer(
          selectedFile.name,
          "Upload",
          selectedFile.size
        );
      }

      setMessage(
        `${successfulUploads} file(s) uploaded successfully.`
      );

      await loadFiles();

    } catch (err) {
      setError(err.message);
      await loadFiles();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // DOWNLOAD FILE

  async function handleDownload(file) {
    try {
      setError("");
      setMessage("");

      const response = await authFetch(
  `${API}/files/${file.id}/download`
);

      if (!response.ok) {
        throw new Error("Download failed.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      // Save successful download in transfer history
      saveTransfer(
  file.filename,
  "Received",
  file.size_bytes || blob.size,
  peerId
);

      setMessage(`${file.filename} download started.`);

    } catch (err) {
      setError(err.message);
    }
  }

  // VERIFY FILE INTEGRITY

  async function handleVerify(file) {
    try {
      setVerifying(file.id);
      setError("");
      setMessage("");

      const response = await authFetch(
  `${API}/files/${file.id}/verify`
);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Verification failed.");
      }

      setVerificationResults((old) => ({
        ...old,
        [file.id]: result
      }));

      if (result.is_valid) {
        setMessage(
          `${file.filename}: SHA-256 integrity verified.`
        );
      } else {
        setError(
          `${file.filename}: Integrity check failed.`
        );
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying("");
    }
  }

  const filteredFiles = files.filter((file) =>
    (file.filename || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="My Files"
        description="Upload, download and verify files stored in PeerRank."
        action={
          <label className="btn btn-primary upload-label">
            <Upload size={17} />

            {uploading ? "Uploading..." : "Upload files"}

            <input
              type="file"
              multiple
              hidden
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        }
      />

      {message && (
        <div className="success-message">
          <Check /> {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          <X /> {error}
        </div>
      )}

      <div className="toolbar">

        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Search uploaded files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={loadFiles} disabled={loading}>
          <RefreshCw size={17} />
          Refresh
        </Button>

      </div>

      <section className="panel">
        <h2>Uploaded files</h2>

        <p>{filteredFiles.length} files found</p>

        {loading ? (
          <p>Loading files...</p>
        ) : filteredFiles.length === 0 ? (
          <p>
            No uploaded files found. Upload a file to get started.
          </p>
        ) : (

          <div className="table-wrap">
            <table>

              <thead>
                <tr>
                  <th>NAME</th>
                  <th>TYPE</th>
                  <th>SIZE</th>
                  <th>UPLOADED</th>
                  <th>INTEGRITY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredFiles.map((file) => {
                  const verification = verificationResults[file.id];

                  return (
                    <tr key={file.id}>

                      <td>
                        <FileText size={17} />
                        {file.filename}
                      </td>

                      <td>
                        {(file.filename || "")
                          .split(".")
                          .pop()
                          .toUpperCase()}
                      </td>

                      <td>
                        {formatSize(file.size_bytes)}
                      </td>

                      <td>
                        {file.uploaded_at
                          ? new Date(file.uploaded_at).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        {verification
                          ? verification.integrity
                          : "Not checked"}
                      </td>

                      <td>
                        <button
                          className="row-action"
                          title="Download"
                          onClick={() => handleDownload(file)}
                        >
                          <Download size={18} />
                        </button>

                        <button
                          className="row-action"
                          title="Verify integrity"
                          disabled={verifying === file.id}
                          onClick={() => handleVerify(file)}
                        >
                          <ShieldCheck size={18} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

        )}
      </section>

      <p className="small-note">
        File contents are stored in the backend uploads folder.
        Metadata and SHA-256 hashes are stored in MongoDB Atlas.
      </p>
    </>
  );
}

// ==========================================
// PEERS
// ==========================================


function Peers() {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [sendingPeerId, setSendingPeerId] = useState("");
    const [connectionStates, setConnectionStates] = useState({});

  async function loadPeers() {
    try {
      setLoading(true);
      setError("");

      const response = await authFetch(`${API}/peers`);

      if (!response.ok) {
        throw new Error("Unable to load peers.");
      }

      const data = await response.json();
      setPeers(Array.isArray(data) ? data : data.peers || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeers();

    const interval = setInterval(loadPeers, 10000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
  const updateConnectionStates = () => {
    if (!window.peerrankGetPeerConnectionState) return;

    setConnectionStates((previous) => {
      const updated = {};

      peers.forEach((peer) => {
        const peerId = peer.id || peer.peer_id;

        if (peerId) {
          updated[peerId] =
            window.peerrankGetPeerConnectionState(peerId);
        }
      });

      return updated;
    });
  };

  updateConnectionStates();

  const interval = setInterval(updateConnectionStates, 1000);

  return () => clearInterval(interval);
}, [peers]);

  async function connectPeer(peerId) {
    try {
      setMessage(`Connecting to ${peerId}...`);

      if (!window.peerrankConnectToPeer) {
        throw new Error("PeerRank connection service is not ready.");
      }

      await window.peerrankConnectToPeer(peerId);

      setMessage("Connection request sent. Wait until WebRTC shows connected.");
    } catch (err) {
      setMessage(`Connection failed: ${err.message}`);
    }
  }

  async function sendFile(peerId) {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    try {
      setSendingPeerId(peerId);
      setMessage(`Sending ${selectedFile.name}...`);

      if (!window.peerrankSendFileToPeer) {
        throw new Error("File transfer service is not ready.");
      }

      await window.peerrankSendFileToPeer(selectedFile, peerId);

      setMessage(`Successfully sent ${selectedFile.name}!`);
      setSelectedFile(null);

      const fileInput = document.getElementById("peerrank-file-input");
      if (fileInput) fileInput.value = "";

    } catch (err) {
      setMessage(`File transfer failed: ${err.message}`);
    } finally {
      setSendingPeerId("");
    }
  }

  return (
    <>
      <PageHeader
        title="Connected Peers"
        description="Connect to another peer and share files directly."
        action={
          <Button onClick={loadPeers}>
            <RefreshCw size={17} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="error-message">{error}</div>
      )}

      <section className="panel">
        <h2>Select a file to share</h2>

        <input
          id="peerrank-file-input"
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setMessage("");
          }}
        />

        {selectedFile && (
          <p>
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}

        {message && (
          <p>{message}</p>
        )}
      </section>

      <section className="panel">
        <h2>Peer list</h2>

        {loading ? (
          <p>Loading peers...</p>
        ) : peers.length === 0 ? (
          <p>No peers registered yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PEER NAME</th>
                  <th>PEER ID</th>
                  <th>IP ADDRESS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {peers.map((peer, index) => {
  const peerId = peer.id || peer.peer_id;
  const connectionState =
    connectionStates[peerId] || "not-connected";

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  const connectionLabel = {
    connected: "Connected",
    connecting: "Connecting...",
    failed: "Connection Failed",
    disconnected: "Disconnected",
    "not-connected": "Not Connected"
  }[connectionState] || "Not Connected";

                  return (
                    <tr key={peerId || index}>
                      <td>
                        {peer.name || peer.peer_name || "Unnamed peer"}
                      </td>

                      <td>{peerId || "—"}</td>

                      <td>
                        {peer.ip_address || peer.ip || "—"}
                      </td>

                      <td>
  <div>
    <span>{peer.status || "Registered"}</span>
  </div>

  <div
    style={{
      marginTop: "6px",
      fontWeight: "bold",
      color: isConnected ? "green" :
        isConnecting ? "orange" : "gray"
    }}
  >
    {connectionLabel}
  </div>
</td>

                      <td>
  <Button
    onClick={() => connectPeer(peerId)}
    disabled={!peerId || isConnected || isConnecting}
  >
    {isConnected
      ? "Connected"
      : isConnecting
        ? "Connecting..."
        : "Connect"}
  </Button>

  <Button
    onClick={() => sendFile(peerId)}
    disabled={
      !peerId ||
      !selectedFile ||
      !isConnected ||
      sendingPeerId !== ""
    }
  >
    {sendingPeerId === peerId ? "Sending..." : "Send File"}
  </Button>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


// ==========================================
// PEER RANKING
// ==========================================


function Ranking() {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRanking() {
    try {
      setError("");

      // const response = await authFetch(`${API}/peers/ranking`);
      const response = await authFetch(`${API}/peers/ranking`);

      if (!response.ok) {
        throw new Error("Unable to load peer ranking.");
      }

      const data = await response.json();

      setPeers(Array.isArray(data) ? data : data.peers || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();

    const interval = setInterval(loadRanking, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <PageHeader
        title="Peer Ranking"
        description="Compare online peers using response time, speed, availability and workload."
        action={
          <Button onClick={loadRanking} disabled={loading}>
            <RefreshCw size={17} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {error && (
        <div className="error-message">{error}</div>
      )}

      <section className="panel">
        <h2>Peer Performance Rankings</h2>

        <p>
          Online peers: <strong>{peers.length}</strong>
        </p>

        {loading ? (
          <p>Loading rankings...</p>
        ) : peers.length === 0 ? (
          <p>No online peers available for ranking.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>PEER</th>
                  <th>RESPONSE</th>
                  <th>SPEED</th>
                  <th>AVAILABILITY</th>
                  <th>WORKLOAD</th>
                  <th>FINAL SCORE</th>
                </tr>
              </thead>

              <tbody>
                {peers.map((peer, index) => {
                  const performance = peer.performance || {};

                  return (
                    <tr key={peer.id || peer.peer_id || index}>
                      <td>#{peer.rank || index + 1}</td>

                      <td>
                        {peer.peer_name || peer.name || "Peer"}
                      </td>

                      <td>{performance.latency_score ?? "—"}</td>
                      <td>{performance.speed_score ?? "—"}</td>
                      <td>{performance.availability_score ?? "—"}</td>
                      <td>{performance.workload_score ?? "—"}</td>

                      <td>
                        <strong>
                          {performance.final_score ?? peer.score ?? "—"}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


// ==========================================
// TRANSFERS
// ==========================================


function Transfers() {
  const [transfers, setTransfers] = useState([]);

  function loadTransfers() {
    try {
      const data = JSON.parse(
        localStorage.getItem("peerrank_transfers") || "[]"
      );

      setTransfers(Array.isArray(data) ? data : []);
    } catch {
      setTransfers([]);
    }
  }

  useEffect(() => {
    loadTransfers();
  }, []);

  function clearHistory() {
    if (window.confirm("Clear all transfer history?")) {
      localStorage.removeItem("peerrank_transfers");
      setTransfers([]);
    }
  }

  function formatSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return (
    <>
      <PageHeader
        title="Transfers"
        description="View your peer-to-peer file transfer activity."
        action={
          <Button onClick={loadTransfers}>
            <RefreshCw size={17} />
            Refresh
          </Button>
        }
      />

      <section className="panel">
        <div className="transfer-header">
          <Activity size={28} />
          <h2>Transfer activity</h2>

          {transfers.length > 0 && (
            <button className="btn" onClick={clearHistory}>
              Clear History
            </button>
          )}
        </div>

        {transfers.length === 0 ? (
          <p>No transfer history available yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FILE NAME</th>
                  <th>TRANSFER TYPE</th>
                  <th>FILE SIZE</th>
                  <th>DATE & TIME</th>
                  <th>PEER ID</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((transfer, index) => (
                  <tr key={transfer.id || index}>
                    <td>
                      <FileText size={17} />
                      {transfer.fileName}
                    </td>

                    <td>
                      {transfer.type === "Sent" ||
                      transfer.type === "Upload" ? (
                        <span>
                          <Upload size={15} />
                          {transfer.type}
                        </span>
                      ) : (
                        <span>
                          <Download size={15} />
                          {transfer.type === "Received"
                            ? "Received"
                            : transfer.type}
                        </span>
                      )}
                    </td>

                    <td>{formatSize(transfer.sizeBytes)}</td>

                    <td>{transfer.date}</td>

                    <td>
                      <code>
                        {transfer.peerId || "Not available"}
                      </code>
                    </td>

                    <td>
                      <span className="success-message">
                        <Check size={15} />
                        {transfer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


// ==========================================
// NETWORK MONITOR
// ==========================================


function NetworkMonitor() {
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [connectionStates, setConnectionStates] = useState({});

  async function loadNetwork() {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(`${API}/peers`);
      const response = await authFetch(`${API}/peers`);

      if (!response.ok) {
        throw new Error("Unable to connect to the peer backend.");
      }

      const data = await response.json();

      const peerList = Array.isArray(data)
        ? data
        : data.peers || [];

      setPeers(peerList);
      setLastUpdated(new Date().toLocaleString());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNetwork();
  }, []);

  // Treat only an explicit online status as online.
  const onlinePeers = peers.filter(
    peer => String(peer.status || "").toLowerCase() === "online"
  );

  const offlinePeers = peers.length - onlinePeers.length;

  return (
    <>
      <PageHeader
        title="Network Monitor"
        description="Monitor registered peers and network connectivity."
        action={
          <Button onClick={loadNetwork} disabled={loading}>
            <RefreshCw size={17} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {error && (
        <div className="error-message">
          <X size={18} /> {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <Network />
          <p>Total Peers</p>
          <h2>{loading ? "..." : peers.length}</h2>
        </div>

        <div className="stat-card">
          <Check />
          <p>Online Peers</p>
          <h2>{loading ? "..." : onlinePeers.length}</h2>
        </div>

        <div className="stat-card">
          <X />
          <p>Offline / Unknown</p>
          <h2>{loading ? "..." : offlinePeers}</h2>
        </div>

        <div className="stat-card">
          <Activity />
          <p>Backend Connection</p>
          <h2>{loading ? "Checking..." : error ? "Disconnected" : "Connected"}</h2>
        </div>
      </div>

      <section className="panel">
        <h2>
          <Network size={22} /> Network Overview
        </h2>

        <p>
          Registered peers: {peers.length}
        </p>

        <p>
          Last updated: {lastUpdated || "Not updated yet"}
        </p>
      </section>

      <section className="panel">
        <h2>Peer Connection Details</h2>

        {loading ? (
          <p>Loading peer information...</p>
        ) : peers.length === 0 ? (
          <p>No registered peers found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PEER NAME</th>
                  <th>PEER ID</th>
                  <th>IP ADDRESS</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {peers.map((peer, index) => {
                  const status = String(
                    peer.status || "Unknown"
                  );

                  return (
                    <tr key={peer.id || peer.peer_id || index}>
                      <td>
                        {peer.name || peer.peer_name || "Unnamed peer"}
                      </td>

                      <td>
                        {peer.id || peer.peer_id || "—"}
                      </td>

                      <td>
                        {peer.ip_address || peer.ip || "—"}
                      </td>

                      <td>
                        <span>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}


// ==========================================
// PROFILE
// ==========================================


function Profile() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("peerrank_user") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(
  localStorage.getItem("peerrank_profile_image") || ""
);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "Administrator"
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value
    }));
  }

  function saveProfile(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }

    const updatedUser = {
      ...user,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role
    };

    localStorage.setItem(
      "peerrank_user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
    setEditing(false);
    setMessage("Profile updated successfully!");
  }

  function cancelEditing() {
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "Administrator"
    });

    setEditing(false);
    setMessage("");
  }
  function handleImageUpload(e) {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Image size must be less than 2 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onloadend = () => {
    const imageData = reader.result;

    localStorage.setItem(
      "peerrank_profile_image",
      imageData
    );

    setProfileImage(imageData);
  };

  reader.readAsDataURL(file);
}
function removeProfileImage() {
  localStorage.removeItem("peerrank_profile_image");
  setProfileImage("");
}

  const initials = (user.name || "Guest User")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and manage your PeerRank account."
      />

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      <section className="panel">
        <div className="profile-details">

          <div className="profile-avatar">
  {profileImage ? (
    <img src={profileImage} alt="Profile" />
  ) : (
    initials
  )}
</div>

<label className="profile-upload-btn">
  Change Profile Picture
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    hidden
  />
</label>
{profileImage && (
  <button
    type="button"
    className="profile-remove-btn"
    onClick={removeProfileImage}
  >
    Remove Picture
  </button>
)}
          <h2>{user.name || "Guest User"}</h2>

          <p>{user.email || "No email available"}</p>

          <span className="profile-role">
            {user.role || "Administrator"}
          </span>

        </div>
      </section>

      <section className="panel">
        <h2>Personal Information</h2>

        {editing ? (
          <form onSubmit={saveProfile}>

            <div className="profile-form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="profile-form-group">
              <label>Role</label>
              <input
                type="text"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Enter your role"
              />
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>

              <button
                type="button"
                className="btn"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>

          </form>
        ) : (
          <>
            <div className="profile-info">
              <p>
                <strong>Full Name:</strong>{" "}
                {user.name || "Not provided"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {user.email || "Not provided"}
              </p>

              <p>
                <strong>Role:</strong>{" "}
                {user.role || "Administrator"}
              </p>

              <p>
                <strong>Platform:</strong> PeerRank
              </p>

              <p>
                <strong>Account Status:</strong> Active
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
            >
              <User size={17} />
              Edit Profile
            </button>
          </>
        )}
      </section>
    </>
  );
}


// ==========================================
// SETTINGS
// ==========================================

function SettingsPage() {
  const [notifications, setNotifications] = useState(
    localStorage.getItem("peerrank_notifications") !== "false"
  );

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("peerrank_dark_mode") !== "false"
  );

  const [message, setMessage] = useState("");

  function saveSettings() {
    localStorage.setItem(
      "peerrank_notifications",
      String(notifications)
    );

    localStorage.setItem(
      "peerrank_dark_mode",
      String(darkMode)
    );

    setMessage("Settings saved successfully!");
  }

  function logout() {
  localStorage.removeItem("peerrank_user");
  localStorage.removeItem("peerrank_logged_in");
  localStorage.removeItem("peerrank_access_token");

  window.location.href = "/login";
}

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your PeerRank application preferences."
      />

      <section className="panel">

        <Settings size={28} />

        <h2>General Settings</h2>

        <div className="settings-option">

          <div>
            <h3>Notifications</h3>
            <p>Enable or disable application notifications.</p>
          </div>

          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />

        </div>

        <div className="settings-option">

          <div>
            <h3>Dark Mode Preference</h3>
            <p>Save your preferred display mode.</p>
          </div>

          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />

        </div>

        <button
          className="auth-submit"
          onClick={saveSettings}
        >
          Save Settings
        </button>

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

      </section>

      <section className="panel">

        <h2>Account</h2>

        <p>Sign out of your PeerRank account.</p>

        <button
          className="auth-submit"
          onClick={logout}
        >
          Logout
        </button>

      </section>
    </>
  );
}

// ==========================================
// PROTECTED ROUTE
// ==========================================


// ==========================================
// PROTECTED ROUTE - JWT VERIFICATION
// ==========================================

function Protected({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      const token = localStorage.getItem(
        "peerrank_access_token"
      );

      if (!token) {
        if (!cancelled) setStatus("unauthorized");
        return;
      }

      try {
        const response = await fetch(`${API}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (cancelled) return;

        if (response.status === 401) {
          localStorage.removeItem("peerrank_user");
          localStorage.removeItem("peerrank_logged_in");
          localStorage.removeItem("peerrank_access_token");

          setStatus("unauthorized");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = await response.json();

        // Refresh user details from the backend
        localStorage.setItem(
          "peerrank_user",
          JSON.stringify(data.user)
        );

        localStorage.setItem(
          "peerrank_logged_in",
          "true"
        );

        setStatus("authorized");

      } catch (error) {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return <div className="auth-page">Verifying your account...</div>;
  }

  if (status === "error") {
    return (
      <div className="auth-page">
        Cannot connect to PeerRank server. Please try again.
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function BrowserPeerPresence() {
  useEffect(() => {
    let deviceId = localStorage.getItem("peerrank_device_id");
    let signalingSocket = null;
    let heartbeatInterval;

   const peerConnections = new Map();
const pendingIceCandidates = new Map();
const dataChannels = new Map();
const incomingTransfers = new Map();
const pendingOutgoingTransfers = new Map();
let activeIncomingTransferId = null;

    const rtcConfiguration = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    };

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("peerrank_device_id", deviceId);
    }

    async function processPendingIceCandidates(peerId, peerConnection) {
      const candidates = pendingIceCandidates.get(peerId) || [];

      for (const candidate of candidates) {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }

      pendingIceCandidates.delete(peerId);
    }
function configureDataChannel(dataChannel, peerId) {
  dataChannel.binaryType = "arraybuffer";

  dataChannels.set(peerId, dataChannel);

  dataChannel.onopen = () => {
    console.log("DataChannel connected:", peerId);
  };

  dataChannel.onclose = () => {
    console.log("DataChannel closed:", peerId);
    dataChannels.delete(peerId);
  };

  dataChannel.onmessage = async (event) => {
    try {
      // Handle file data
 if (event.data instanceof ArrayBuffer) {
  const transfer = incomingTransfers.get(activeIncomingTransferId);

  if (!transfer) {
    console.error("Received file data without an active transfer.");
    return;
  }

  transfer.chunks.push(event.data);
  transfer.receivedBytes += event.data.byteLength;

  console.log(
    "File received:",
    transfer.receivedBytes,
    "/",
    transfer.fileSize
  );

  return;
}

      const message = JSON.parse(event.data);
      // Receiver accepted the file
if (message.type === "file-accepted") {
  const pending = pendingOutgoingTransfers.get(message.transferId);

  if (pending) {
    pending.accept();
  }

  return;
}

// Receiver rejected the file
if (message.type === "file-rejected") {
  const pending = pendingOutgoingTransfers.get(message.transferId);

  if (pending) {
    pending.reject(new Error("Receiver rejected the file."));
    pendingOutgoingTransfers.delete(message.transferId);
  }

  return;
}

// Receiver confirmed successful download
if (message.type === "file-received") {
  const pending = pendingOutgoingTransfers.get(message.transferId);

  if (pending) {
    pending.complete();
    pendingOutgoingTransfers.delete(message.transferId);
  }

  return;
}

// Receiver reported an error
if (message.type === "file-error") {
  const pending = pendingOutgoingTransfers.get(message.transferId);

  if (pending) {
    pending.reject(new Error(message.message || "File transfer failed."));
    pendingOutgoingTransfers.delete(message.transferId);
  }

  return;
}

      // Incoming file request
      if (message.type === "file-offer") {
        const accepted = window.confirm(
          `Receive file "${message.fileName}"?\nSize: ${(
            message.fileSize / (1024 * 1024)
          ).toFixed(2)} MB`
        );

        if (!accepted) {
          dataChannel.send(JSON.stringify({
            type: "file-rejected",
            transferId: message.transferId
          }));
          return;
        }
        if (activeIncomingTransferId !== null) {
  dataChannel.send(JSON.stringify({
    type: "file-rejected",
    transferId: message.transferId
  }));

  console.log("Another file transfer is already active.");
  return;
}

activeIncomingTransferId = message.transferId;

        incomingTransfers.set(message.transferId, {
          fileName: message.fileName,
          fileType: message.fileType,
          fileSize: message.fileSize,
          expectedHash: message.fileHash,
          chunks: [],
          receivedBytes: 0
        });

        dataChannel.send(JSON.stringify({
          type: "file-accepted",
          transferId: message.transferId
        }));

        console.log("File transfer accepted:", message.fileName);
      }

      // File transfer completed
      else if (message.type === "file-complete") {
        const transfer = incomingTransfers.get(message.transferId);

        if (!transfer) {
          console.error("Transfer information not found.");
          return;
        }

        const blob = new Blob(transfer.chunks, {
          type: transfer.fileType || "application/octet-stream"
        });

        const hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          await blob.arrayBuffer()
        );

        const actualHash = Array.from(new Uint8Array(hashBuffer))
          .map(byte => byte.toString(16).padStart(2, "0"))
          .join("");

        if (actualHash !== transfer.expectedHash) {
          console.error("File integrity verification failed.");

          dataChannel.send(JSON.stringify({
            type: "file-error",
            transferId: message.transferId,
            message: "SHA-256 verification failed"
          }));

          incomingTransfers.delete(message.transferId);
          activeIncomingTransferId = null;
          activeIncomingTransferId = null;
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = transfer.fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);

        console.log("File downloaded successfully:", transfer.fileName);
        console.log("SHA-256 verification successful.");
        // Save received peer-to-peer transfer history
saveTransfer(
  transfer.fileName,
  "Received",
  transfer.fileSize || blob.size,
  peerId
);

        dataChannel.send(JSON.stringify({
          type: "file-received",
          transferId: message.transferId
        }));

        // incomingTransfers.delete(message.transferId);
        incomingTransfers.delete(message.transferId);
activeIncomingTransferId = null;
      }

      else {
        console.log("Message received from peer:", message);
      }

    } catch (error) {
      console.error("File receiving error:", error);
    }
  };
}


    function createPeerConnection(targetPeerId) {
      if (peerConnections.has(targetPeerId)) {
        return peerConnections.get(targetPeerId);
      }

      const peerConnection = new RTCPeerConnection(rtcConfiguration);

      peerConnection.onicecandidate = (event) => {
        if (
          event.candidate &&
          signalingSocket?.readyState === WebSocket.OPEN
        ) {
          signalingSocket.send(
            JSON.stringify({
              type: "ice-candidate",
              target_peer_id: targetPeerId,
              payload: event.candidate
            })
          );
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log(
          "WebRTC connection state:",
          targetPeerId,
          peerConnection.connectionState
        );
      };

      peerConnection.ondatachannel = (event) => {
  configureDataChannel(event.channel, targetPeerId);
};

      peerConnections.set(targetPeerId, peerConnection);

      return peerConnection;
    }


async function connectToPeer(targetPeerId) {
  if (
    !signalingSocket ||
    signalingSocket.readyState !== WebSocket.OPEN
  ) {
    console.error("Signaling server is not connected.");
    return;
  }

  // Prevent duplicate connections to the same peer
  const existingConnection = peerConnections.get(targetPeerId);

  if (existingConnection) {
    const state = existingConnection.connectionState;

    if (state !== "failed" && state !== "closed") {
      console.log(
        "Connection already exists with:",
        targetPeerId,
        "State:",
        state
      );
      return;
    }

    existingConnection.close();
    peerConnections.delete(targetPeerId);
  }

  try {
    const peerConnection = createPeerConnection(targetPeerId);

    const dataChannel = peerConnection.createDataChannel(
      "peerrank-files"
    );

    configureDataChannel(dataChannel, targetPeerId);

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    signalingSocket.send(
      JSON.stringify({
        type: "offer",
        target_peer_id: targetPeerId,
        payload: peerConnection.localDescription
      })
    );

    console.log("WebRTC offer sent to:", targetPeerId);

  } catch (error) {
    console.error("Could not connect to peer:", error);
  }
}
async function sendFileToPeer(file, targetPeerId) {
  if (!(file instanceof File)) {
    console.error("Please select a valid file.");
    return;
  }

  const dataChannel = dataChannels.get(targetPeerId);

  if (!dataChannel || dataChannel.readyState !== "open") {
    console.error("Peer is not connected. Connect first.");
    return;
  }

  const transferId = crypto.randomUUID();

  try {
    console.log("Preparing file:", file.name);

    // Calculate SHA-256 hash
    const fileBuffer = await file.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );

    const fileHash = Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

    // Wait for receiver acceptance and completion
    let resolveAccepted;
    let rejectAccepted;
    let resolveCompleted;
    let rejectCompleted;

    const acceptedPromise = new Promise((resolve, reject) => {
      resolveAccepted = resolve;
      rejectAccepted = reject;
    });

    const completedPromise = new Promise((resolve, reject) => {
      resolveCompleted = resolve;
      rejectCompleted = reject;
    });

    // Prevent an unhandled rejection before completion is awaited
    completedPromise.catch(() => {});

    pendingOutgoingTransfers.set(transferId, {
      accept: resolveAccepted,
      reject: (error) => {
        rejectAccepted(error);
        rejectCompleted(error);
      },
      complete: resolveCompleted
    });

    // Request permission from receiver
    dataChannel.send(JSON.stringify({
      type: "file-offer",
      transferId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileHash
    }));

    console.log("File offer sent. Waiting for receiver...");

    await acceptedPromise;

    console.log("Receiver accepted:", file.name);

    // Send file in 16 KB chunks
    const CHUNK_SIZE = 16 * 1024;
    const MAX_BUFFERED_AMOUNT = 1024 * 1024;

    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      if (dataChannel.readyState !== "open") {
        throw new Error("DataChannel disconnected during transfer.");
      }

      // Avoid filling the browser's DataChannel buffer
      while (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
        await new Promise(resolve => setTimeout(resolve, 10));

        if (dataChannel.readyState !== "open") {
          throw new Error("DataChannel disconnected during transfer.");
        }
      }

      const chunk = await file.slice(
        offset,
        offset + CHUNK_SIZE
      ).arrayBuffer();

      dataChannel.send(chunk);

      console.log(
        `Sending: ${Math.min(offset + chunk.byteLength, file.size)} / ${file.size} bytes`
      );
    }

    // Tell receiver that all chunks have been sent
    dataChannel.send(JSON.stringify({
      type: "file-complete",
      transferId
    }));

    console.log("All file chunks sent. Verifying receiver...");

   await completedPromise;

// Save sender-side transfer history
saveTransfer(
  file.name,
  "Sent",
  file.size,
  targetPeerId
);

console.log("File transferred and verified successfully:", file.name);

  } catch (error) {
    console.error("File transfer failed:", error);
  } finally {
    pendingOutgoingTransfers.delete(transferId);
  }
}


    // Temporary testing access
    window.peerrankConnectToPeer = connectToPeer;
    window.peerrankSendFileToPeer = sendFileToPeer;
window.peerrankIsConnectedToPeer = (peerId) =>
  dataChannels.get(peerId)?.readyState === "open";
window.peerrankGetPeerConnectionState = (peerId) => {
  const dataChannel = dataChannels.get(peerId);
  const peerConnection = peerConnections.get(peerId);

  if (dataChannel?.readyState === "open") {
    return "connected";
  }

  if (peerConnection?.connectionState === "connecting") {
    return "connecting";
  }

  if (peerConnection?.connectionState === "failed") {
    return "failed";
  }

  if (peerConnection?.connectionState === "disconnected") {
    return "disconnected";
  }

  return "not-connected";
};
    // CONNECT TO SIGNALING SERVER
    function connectSignaling() {
      if (
        signalingSocket &&
        (
          signalingSocket.readyState === WebSocket.CONNECTING ||
          signalingSocket.readyState === WebSocket.OPEN
        )
      ) {
        return;
      }

      const token = localStorage.getItem("peerrank_access_token");

      if (!token) {
        console.error("PeerRank login token not found.");
        return;
      }

      const wsURL = API.replace(/^http/, "ws") + "/ws/signaling";

      signalingSocket = new WebSocket(wsURL);

      window.peerrankSignalingSocket = signalingSocket;

      signalingSocket.onopen = () => {
        signalingSocket.send(
          JSON.stringify({
            type: "auth",
            token: token,
            device_id: deviceId
          })
        );

        console.log("PeerRank signaling connection opened.");
      };

      // IMPORTANT: onmessage is assigned AFTER creating the WebSocket.
      signalingSocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "ready") {
            console.log(
              "WebRTC signaling ready. Peer ID:",
              message.peer_id
            );
            return;
          }

          if (message.type === "offer") {
            const peerConnection = createPeerConnection(
              message.from_peer_id
            );

            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.payload)
            );

            await processPendingIceCandidates(
              message.from_peer_id,
              peerConnection
            );

            const answer = await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(answer);

            signalingSocket.send(
              JSON.stringify({
                type: "answer",
                target_peer_id: message.from_peer_id,
                payload: peerConnection.localDescription
              })
            );

            console.log(
              "WebRTC answer sent to:",
              message.from_peer_id
            );
          }

          else if (message.type === "answer") {
            const peerConnection = peerConnections.get(
              message.from_peer_id
            );

            if (!peerConnection) {
              console.error("Connection for answer not found.");
              return;
            }

            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.payload)
            );

            await processPendingIceCandidates(
              message.from_peer_id,
              peerConnection
            );

            console.log("WebRTC answer received.");
          }

          else if (message.type === "ice-candidate") {
            const peerId = message.from_peer_id;
            const peerConnection = peerConnections.get(peerId);

            if (
              !peerConnection ||
              !peerConnection.remoteDescription
            ) {
              if (!pendingIceCandidates.has(peerId)) {
                pendingIceCandidates.set(peerId, []);
              }

              pendingIceCandidates.get(peerId).push(
                message.payload
              );

              console.log("ICE candidate queued:", peerId);
              return;
            }

            await peerConnection.addIceCandidate(
              new RTCIceCandidate(message.payload)
            );

            console.log("ICE candidate added:", peerId);
          }

          else {
            console.log("Signaling message received:", message);
          }

        } catch (error) {
          console.error(
            "Signaling message handling failed:",
            error
          );
        }
      };

      signalingSocket.onerror = (error) => {
        console.error("WebSocket signaling error:", error);
      };

      signalingSocket.onclose = () => {
        console.log("PeerRank signaling connection closed.");
      };
    }

    // REGISTER BROWSER AND SEND HEARTBEAT
    async function sendHeartbeat() {
      if (!navigator.onLine) return;

      try {
        const response = await authFetch(
          `${API}/peers/browser/heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              device_id: deviceId,
              peer_name: "Browser device"
            })
          }
        );

        if (!response.ok) {
          console.error(
            "Peer heartbeat failed:",
            await response.text()
          );
          return;
        }

        console.log("PeerRank browser is online.");

        connectSignaling();

      } catch (error) {
        console.error("Peer heartbeat error:", error);
      }
    }

    sendHeartbeat();

    heartbeatInterval = setInterval(
      sendHeartbeat,
      20000
    );

    return () => {
      clearInterval(heartbeatInterval);

      peerConnections.forEach((connection) => {
        connection.close();
      });

      peerConnections.clear();

      if (signalingSocket) {
        signalingSocket.close();
      }

      delete window.peerrankSignalingSocket;
      delete window.peerrankConnectToPeer;
    };

  }, []);

  return null;
}


// ==========================================
// WORKSPACE ROUTES
// ==========================================

function Workspace() {
  return (
    <Protected>
      <Layout>
         <BrowserPeerPresence />

        <Routes>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/files"
            element={<FilesPage />}
          />

          <Route
            path="/peers"
            element={<Peers />}
          />

          <Route
            path="/ranking"
            element={<Ranking />}
          />

          <Route
            path="/transfers"
            element={<Transfers />}
          />

          <Route
            path="/network"
            element={<NetworkMonitor />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Routes>

      </Layout>
    </Protected>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* PUBLIC PAGES */}

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* PROTECTED WORKSPACE */}

        <Route
          path="/*"
          element={<Workspace />}
        />

      </Routes>

    </BrowserRouter>
  );
}
