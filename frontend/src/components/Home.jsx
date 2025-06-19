import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { FaUserCircle } from "react-icons/fa";
import "./Home.css";
import { FaChevronLeft, FaChevronRight, FaHome, FaDollarSign, FaBook, FaInfoCircle } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
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
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
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
          localStorage.clear();
          setUploadStatus("⚠️ Session expired. Please login again.");
          navigate("/login");
          return;
        }
      }

      if (response.ok) {
        const resData = await response.json();
        localStorage.setItem("file_id", resData.file_id);
        setUploadStatus("✅ File uploaded successfully!");
        setFile(null);
      } else {
        const err = await response.json();
        setUploadStatus(`❌ Upload failed: ${JSON.stringify(err)}`);
      }
    } catch (error) {
      setUploadStatus("❌ Unexpected error occurred during upload.");
    }
  };

  const handleFlashcardsClick = async () => {
    setUploadStatus("⚙️ Generating flashcards...");
  
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
  
    if (!accessToken || !refreshToken) {
      setUploadStatus("⚠️ No token found. Please login.");
      navigate("/login");
      return;
    }
  
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
  
    const doGenerateFlashcards = async (token) =>
      await fetch("http://127.0.0.1:8000/api/generate-flashcards/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_id: localStorage.getItem("file_id") }),
      });
  
    try {
      let response = await doGenerateFlashcards(accessToken);
  
      if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        response = await doGenerateFlashcards(newAccessToken);
      }
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to generate flashcards");
      }
  
      const data = await response.json();
      const fileId = localStorage.getItem("file_id");
      const allFlashcards = JSON.parse(localStorage.getItem("flashcardsData") || "{}");
      
      // Create a unique ID per flashcard set
      const flashcardSetId = `${fileId}_${Date.now()}`;
      
      allFlashcards[flashcardSetId] = {
        flashcards: data.flashcards,
        created_at: new Date().toISOString(),
        file_id: fileId
      };
      
      localStorage.setItem("flashcardsData", JSON.stringify(allFlashcards));
  
      // ✅ Then navigate
      navigate("/flashcards", { state: { loading: false, flashcardSetId } });
    } catch (error) {
      navigate("/flashcards", {
        state: { loading: false, error: error.message },
      });
    }
  };
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    // Reset any global theme class from previous page (e.g., dark-mode)
    document.body.className = "light-mode"; // or empty string if you don’t use a global theme
  }, []);

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        {/* Profile Dropdown in Top-Right */}
        <div className="topbar">
          <div className="user-menu">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="avatar">
              <FaUserCircle size={28} />
            </button>
            <div className={`dropdown ${dropdownOpen ? "active" : ""}`}>
              <button onClick={() => navigate("/profile")}>👤 Profile</button>
              <button onClick={() => navigate("/settings")}>⚙️ Settings</button>
              <button onClick={handleLogout} className="logout">🚪 Logout</button>
            </div>
          </div>
        </div>
        <div className="center-wrapper">
          <div className="description-block">
            <h1 className="main-title">AI-powered Study Tool</h1>
            <p className="tool-description">
              Upload your PDFs and get summarized insights instantly. Designed to boost your learning with smart content analysis and fast processing.
            </p>
          </div>

          <div className="upload-box">
            <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} hidden />
            <label htmlFor="pdf-upload" className="choose-btn">📄 {file ? file.name : "Choose PDF"}</label>
            <button className="upload-btn" onClick={uploadFile} disabled={!file}>📤 Upload</button>
          </div>

          {uploadStatus && (
            <div className={`upload-message ${uploadStatus.startsWith("✅") ? "success-message" : "error-message"}`}>
              <span className="icon">{uploadStatus.startsWith("✅") ? "✅" : "❌"}</span>
              <span className="text">{uploadStatus.replace(/^✅ |^❌ /, "")}</span>
            </div>
          )}
        </div>
  
        {uploadStatus === "✅ File uploaded successfully!" && (
          <div className="cards-container">
            <div className="card" onClick={handleFlashcardsClick}>
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
  );
}
