import React from "react";
import { FaChevronLeft, FaChevronRight, FaHome, FaDollarSign, FaBook, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ collapsed, toggleSidebar }) {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      <h2 className="brand">{!collapsed && "📘 LearnMate"}</h2>
      <nav className="sidebar-links">
        <a onClick={() => navigate("/")}>
          <FaHome />
          {!collapsed && <span>Home</span>}
        </a>
        <a onClick={() => navigate("/pricing")}>
          <FaDollarSign />
          {!collapsed && <span>Pricing</span>}
        </a>
        <a onClick={() => navigate("/library")}>
          <FaBook />
          {!collapsed && <span>My Library</span>}
        </a>
        <a onClick={() => navigate("/about")}>
          <FaInfoCircle />
          {!collapsed && <span>About</span>}
        </a>
      </nav>
    </aside>
  );
}
