import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { FaUserCircle } from "react-icons/fa";

export default function Home() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus("");
  };
  
  const uploadFile = async () => {
    if (!file) {
      setUploadStatus("❗ Please select a file first.");
      return;
    }
  
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
  
    if (!accessToken || !refreshToken) {
      setUploadStatus("⚠️ No token found. Please login.");
      navigate("/login");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
  
    const doUpload = async (token) => {
      return await fetch("http://localhost:8000/api/upload/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    };
  
    const refreshAccessToken = async () => {
      const res = await fetch("http://localhost:8000/api/refresh_token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
  
      if (!res.ok) {
        throw new Error("Refresh token invalid");
      }
  
      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      return data.access;
    };
  
    try {
      let response = await doUpload(accessToken);
  
      if (response.status === 401) {
        try {
          const newAccessToken = await refreshAccessToken();
          response = await doUpload(newAccessToken);
        } catch (err) {
          console.error("Token refresh failed:", err);
          localStorage.clear();
          setUploadStatus("⚠️ Session expired. Please login again.");
          navigate("/login");
          return;
        }
      }
  
      if (response.ok) {
        setUploadStatus("✅ File uploaded successfully!");
        setFile(null);
      } else {
        const err = await response.json();
        setUploadStatus(`❌ Upload failed: ${JSON.stringify(err)}`);
      }
  
    } catch (error) {
      console.error("Unexpected error:", error);
      setUploadStatus("❌ Unexpected error occurred during upload.");
    }
  };
  

  return (
    <>
      <div className="container">
        <nav className="navbar">
          <div className="nav-left">
            <h2 className="brand">LearnMate</h2>
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/resources">Resources</a>
            <a href="/about">About</a>
          </div>
          <div className="nav-right">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="avatar">
              <FaUserCircle size={30} />
            </button>
            <div className={`dropdown ${dropdownOpen ? "active" : ""}`}>
              <button onClick={() => navigate("/profile")}>👤 Profile</button>
              <button onClick={() => navigate("/settings")}>⚙️ Settings</button>
              <button onClick={handleLogout} className="logout">🚪 Logout</button>
            </div>
          </div>
        </nav>

        <main className="main">
          <h1>Welcome, <span className="username">{user?.username}</span> 👋</h1>
          <p>You have successfully logged in to <strong>LearnMate</strong>.</p>

          <div className="upload-section">
            <h2>Upload a PDF</h2>
            <div className="upload-box">
              <label className="custom-file-upload">
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                {file ? file.name : "📄 Choose PDF"}
              </label>
              <button className="upload-btn" onClick={uploadFile}>📤 Upload</button>
              {uploadStatus && (
                <p className={`upload-status ${uploadStatus.startsWith("✅") ? "success" : "error"}`}>
                  {uploadStatus}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .container {
              min-height: 100vh;
              background: linear-gradient(145deg, #f8fafc, #e2e8f0);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .navbar {
              background: #ffffff;
              padding: 1rem 2rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
              position: relative;
              z-index: 100;
            }
            .nav-left {
              display: flex;
              align-items: center;
              gap: 1.5rem;
            }
            .nav-left a {
              color: #374151;
              text-decoration: none;
              font-weight: 500;
              position: relative;
              transition: color 0.2s ease;
            }
            .nav-left a::after {
              content: "";
              position: absolute;
              width: 0%;
              height: 2px;
              bottom: -4px;
              left: 0;
              background-color: #2563eb;
              transition: width 0.3s ease;
            }
            .nav-left a:hover {
              color: #2563eb;
            }
            .nav-left a:hover::after {
              width: 100%;
            }
            .brand {
              font-size: 1.7rem;
              font-weight: bold;
              color: #2563eb;
            }
            .avatar {
              background: none;
              border: none;
              color: #4b5563;
              cursor: pointer;
              transition: color 0.2s ease;
            }
            .avatar:hover {
              color: #2563eb;
            }
            .nav-right {
              position: relative;
            }
            .dropdown {
              position: absolute;
              top: 50px;
              right: 0;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
              width: 180px;
              opacity: 0;
              visibility: hidden;
              transform: translateY(-10px);
              transition: all 0.3s ease;
              overflow: hidden;
            }
            .dropdown.active {
              opacity: 1;
              visibility: visible;
              transform: translateY(0);
            }
            .dropdown button {
              width: 100%;
              padding: 0.75rem 1rem;
              background: none;
              border: none;
              text-align: left;
              font-size: 0.95rem;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s ease;
            }
            .dropdown button:hover {
              background: #f1f5f9;
            }
            .logout {
              color: #dc2626;
            }
            .main {
              text-align: center;
              margin-top: 4rem;
              padding: 1rem;
            }
            .main h1 {
              font-size: 2.5rem;
              color: #1f2937;
              font-weight: 700;
            }
            .main .username {
              color: #2563eb;
            }
            .main p {
              margin-top: 1rem;
              font-size: 1.2rem;
              color: #4b5563;
            }
            .upload-section {
              margin-top: 3rem;
              padding: 1rem;
            }
            .upload-section h2 {
              font-size: 1.6rem;
              margin-bottom: 1.5rem;
              color: #1f2937;
            }
            .upload-box {
              background: white;
              padding: 2rem;
              max-width: 400px;
              margin: 0 auto;
              border-radius: 1rem;
              box-shadow: 0 8px 16px rgba(0,0,0,0.08);
              display: flex;
              flex-direction: column;
              gap: 1rem;
              align-items: center;
            }
            .custom-file-upload {
              display: inline-block;
              padding: 0.8rem 1.5rem;
              cursor: pointer;
              background-color: #2563eb;
              color: white;
              border-radius: 0.5rem;
              font-weight: 500;
              transition: background 0.2s ease;
            }
            .custom-file-upload:hover {
              background-color: #1d4ed8;
            }
            .custom-file-upload input {
              display: none;
            }
            .upload-btn {
              background-color: #10b981;
              color: white;
              padding: 0.7rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              font-size: 1rem;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s ease;
            }
            .upload-btn:hover {
              background-color: #059669;
            }
            .upload-status {
              font-weight: 500;
              margin-top: 0.5rem;
            }
            .upload-status.success {
              color: #10b981;
            }
            .upload-status.error {
              color: #dc2626;
            }
            @media (max-width: 768px) {
              .nav-left {
                flex-wrap: wrap;
                gap: 1rem;
              }
              .main h1 {
                font-size: 2rem;
              }
              .main p {
                font-size: 1rem;
              }
              .upload-box {
                width: 90%;
              }
            }
          `,
        }}
      />
    </>
  );
}
