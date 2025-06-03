import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.tokens && data.tokens.access) {
        console.log("Navigating to home...");
        localStorage.setItem("access_token", data.tokens.access);
        localStorage.setItem("refresh_token", data.tokens.refresh);
        localStorage.setItem("username", data.detail.username);
        login(data.tokens.access, data.detail.username);
        navigate("/");
        console.log("Navigating to home Succesful...");
      } else {
        console.warn("Login failed:", data);
        alert(data.message || data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(to right, #c3dafe, #a5b4fc)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Segoe UI', sans-serif",
    },
    card: {
      backgroundColor: "#fff",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "400px",
    },
    heading: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "24px",
      textAlign: "center",
      color: "#4f46e5",
    },
    form: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      color: "#333",
      fontSize: "14px",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      marginBottom: "16px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      backgroundColor: "#4f46e5",
      color: "#fff",
      padding: "12px",
      fontSize: "16px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#4338ca",
    },
    footerText: {
      marginTop: "16px",
      fontSize: "13px",
      textAlign: "center",
      color: "#555",
    },
    link: {
      color: "#4f46e5",
      textDecoration: "none",
      fontWeight: "500",
      marginLeft: "4px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Welcome Back</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="text"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
            onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
          >
            Log In
          </button>
        </form>
        <p style={styles.footerText}>
          Don't have an account?
          <a href="/register" style={styles.link}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
