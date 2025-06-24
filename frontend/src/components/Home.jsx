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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) console.warn("Server-side logout failed");
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

    const doUpload = async (token) =>
      await fetch("http://localhost:8000/api/upload/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

    const refreshAccessToken = async () => {
      const res = await fetch("http://localhost:8000/api/refresh_token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) throw new Error("Refresh token invalid");

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
          <h1>LearnMate – Your AI-powered Study Tool</h1>
          <p className="tool-description">
            Upload your PDFs and get summarized insights instantly. Designed to boost your learning with smart content analysis and fast processing.
          </p>

          <div className="upload-box">
            <input
              type="file"
              id="pdf-upload"
              accept="application/pdf"
              onChange={handleFileChange}
              hidden
            />
            <label htmlFor="pdf-upload" className="choose-btn">
              📄 {file ? file.name : "Choose PDF"}
            </label>

            <button className="upload-btn" onClick={uploadFile} disabled={!file}>
              📤 Upload
            </button>
          </div>

          {uploadStatus && (
            <div
              className={`upload-message ${
                uploadStatus.startsWith("✅") ? "success-message" : "error-message"
              }`}
            >
              <span className="icon">{uploadStatus.startsWith("✅") ? "✅" : "❌"}</span>
              <span className="text">{uploadStatus.replace(/^✅ |^❌ /, "")}</span>
            </div>
          )}
          {uploadStatus === "✅ File uploaded successfully!" && (
            <div className="cards-container">
              <div className="card" onClick={() => navigate('/flashcards')}>
                <h3>Flashcards Q/A</h3>
                <p>Quick review with generated questions and answers.</p>
              </div>
              <div className="card" onClick={() => navigate('/quizzes')}>
                <h3>Quizzes</h3>
                <p>Test your knowledge with AI-generated quizzes.</p>
              </div>
              <div className="card" onClick={() => navigate('/notes')}>
                <h3>Important Notes</h3>
                <p>Summarized key points extracted from your PDF.</p>
              </div>
              <div className="card" onClick={() => navigate('/tutor')}>
                <h3>Tutor Assistant</h3>
                <p>Interactive explanations and personalized help.</p>
              </div>
            </div>
          )}
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
              flex-wrap: wrap;
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

            .tool-description {
              font-size: 1.1rem;
              color: #4b5563;
              margin-top: 0.5rem;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
              text-align: center;
            }

            .upload-box {
              background: #ffffff;
              padding: 2rem;
              max-width: 450px;
              margin: 2rem auto;
              border-radius: 1rem;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
              display: flex;
              gap: 1rem;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
            }

            .choose-btn {
              background-color: #f3f4f6;
              color: #374151;
              border: 2px dashed #cbd5e1;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-weight: 500;
            }

            .choose-btn:hover {
              background-color: #e5e7eb;
              border-color: #9ca3af;
            }

            .upload-btn {
              background-color: #4f46e5;
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              transition: background-color 0.3s ease;
              font-weight: 600;
            }

            .upload-btn:hover {
              background-color: #4338ca;
            }

            .upload-btn:disabled {
              background-color: #9ca3af;
              cursor: not-allowed;
            }

            .upload-status {
              font-weight: 500;
              margin-top: 1rem;
            }

            .upload-status.success {
              color: #10b981;
            }

            .upload-status.error {
              color: #dc2626;
            }
            .cards-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 1.5rem;
              max-width: 1000px;
              margin: 2rem auto;
              padding: 1rem;
            }

            .card {
              background: linear-gradient(to bottom right, #f8fafc, #e0f2fe);
              border-radius: 1rem;
              cursor: pointer;
              padding: 1.5rem;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              text-align: left;
              cursor: pointer;
              border: 1px solid #e2e8f0;
            }

            .card:hover {
              transform: translateY(-5px);
              box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            }

            .card h3 {
              font-size: 1.25rem;
              margin-bottom: 0.5rem;
              color: #1e40af;
              font-weight: 600;
            }

            .card p {
              font-size: 0.95rem;
              color: #374151;
              line-height: 1.4;
            }
            @media (max-width: 768px) {
              .navbar {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
              }

              .nav-left,
              .nav-right {
                width: 100%;
                justify-content: space-between;
              }

              .main h1 {
                font-size: 2rem;
              }

              .upload-box {
                width: 90%;
                flex-direction: column;
              }
            }
          `,
        }}
      />
    </>
  );
}
