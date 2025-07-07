import React, { useState } from "react";
import { FaHome, FaTools } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Quiz.css"; // Reuse your Quiz theme CSS

export default function Pricing() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="layout quiz-page">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <header className="quiz-header">
          <div className="controls">
            <button onClick={() => navigate("/")}>
              <FaHome /> Home
            </button>
          </div>
        </header>

        <h2 className="page-subtitle">About</h2>

        <section className="quiz-grid">
          <div className="quiz-card" style={{ textAlign: "center" }}>
            <FaTools size={60} color="#007bff" style={{ marginBottom: "15px" }} />
            <h3 style={{ color: "#333" }}>🚧 Page Under Construction</h3>
            <p style={{ fontSize: "1.1rem", color: "#555" }}>
              We're currently working on our About Page. Please check back soon!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
