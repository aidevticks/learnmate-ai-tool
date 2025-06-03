import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Home() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      logout();
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        console.log("Logged out successfully");
      } else {
        console.warn("Server-side logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Welcome {user?.username} to the Home Page!</h1>
      <p>You have successfully logged in.</p>
      <button onClick={handleLogout} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Logout
      </button>
    </div>
  );
}
