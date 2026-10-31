
import { Link } from "react-router-dom";
import {
  Network, ShieldCheck, Zap, Users,
  ArrowRight, Cloud, Activity
} from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <Network /> PeerRank
        </Link>

        <div>
          <Link to="/login" className="landing-login">Login</Link>
          <Link to="/register" className="landing-register">
            Get Started <ArrowRight size={16}/>
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag">
          <Activity size={15}/> Intelligent Peer-to-Peer Network
        </div>

        <h1>
          Share Files.<br/>
          <span>Rank Peers.</span><br/>
          Build Trust.
        </h1>

        <p>
          An intelligent peer-to-peer file sharing platform
          that evaluates peer performance, manages files
          and verifies data integrity.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="landing-register">
            Get Started <ArrowRight size={18}/>
          </Link>
          <Link to="/login" className="hero-secondary">
            Sign In
          </Link>
        </div>

        <div className="hero-stats">
          <div><strong>SHA-256</strong><span>File integrity</span></div>
          <div><strong>Smart</strong><span>Peer ranking</span></div>
          <div><strong>Fast</strong><span>File sharing</span></div>
        </div>
      </section>

      <section className="features-section">
        <h2>Powerful Features</h2>
        <p>Everything you need for intelligent file sharing.</p>

        <div className="features-grid">
          <Feature icon={<Users/>} title="Peer Discovery"
            description="Register and discover peers connected to the system."/>

          <Feature icon={<ShieldCheck/>} title="File Integrity"
            description="Verify downloaded files using SHA-256 hashes."/>

          <Feature icon={<Zap/>} title="Smart Ranking"
            description="Evaluate peers based on performance and availability."/>

          <Feature icon={<Cloud/>} title="File Management"
            description="Upload, organize and download files."/>

          <Feature icon={<Network/>} title="Network Monitoring"
            description="Monitor peer connectivity and network performance."/>

          <Feature icon={<Activity/>} title="Transfer Activity"
            description="Track file transfer operations and their status."/>
        </div>
      </section>

      <footer className="landing-footer">
        PeerRank — Intelligent Peer-to-Peer File Ranking System
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
