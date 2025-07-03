import React, { useContext, useState, useEffect } from "react";
import { FaRegStickyNote, FaChalkboardTeacher } from "react-icons/fa";
import { HiMiniLightBulb, HiMiniClipboardDocumentCheck } from "react-icons/hi2";
import { GiCardExchange } from "react-icons/gi";         // Flashcards
import { MdQuiz } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";  // Notes
import { PiStudentFill } from "react-icons/pi";           // Tutor
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
	const [collapsed, setCollapsed] = useState(false);

	const toggleSidebar = () => {
		setCollapsed(!collapsed);
	};

	useEffect(() => {
		document.body.className = "light-mode";
	
		const savedFileName = localStorage.getItem("uploaded_file_name");
		if (savedFileName) {
			setFile({ name: savedFileName }); // 🧠 Simulate file info for UI
		}
	}, []);

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
				localStorage.setItem("uploaded_file_name", file.name); // 💾 Save file name
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

			const flashcardSetId = `${fileId}_${Date.now()}`;

			allFlashcards[flashcardSetId] = {
				flashcards: data.flashcards,
				created_at: new Date().toISOString(),
				file_id: fileId,
			};

			localStorage.setItem("flashcardsData", JSON.stringify(allFlashcards));

			navigate("/flashcards", { state: { loading: false, flashcardSetId } });
		} catch (error) {
			navigate("/flashcards", {
				state: { loading: false, error: error.message },
			});
		}
	};

  const handleQuizzesClick = async () => {
		setUploadStatus("⚙️ Generating quizzes...");
		const fileId = localStorage.getItem("file_id");
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
	
		const doGenerateQuiz = async (token) =>
			await fetch("http://127.0.0.1:8000/api/generate-quiz/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ file_id: fileId }),
			});
	
		try {
			let response = await doGenerateQuiz(accessToken);
			if (response.status === 401) {
				const newAccessToken = await refreshAccessToken();
				response = await doGenerateQuiz(newAccessToken);
			}
	
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "Failed to generate quizzes");
			}
	
			const data = await response.json();
			const quizSetId = `${fileId}_${Date.now()}`;
			const allQuizzes = JSON.parse(localStorage.getItem("quizData") || "{}");
	
			allQuizzes[quizSetId] = {
				quiz: data.quiz,
				created_at: new Date().toISOString(),
				file_id: fileId,
				score: null,
				total: data.quiz.length,
			};
	
			localStorage.setItem("quizData", JSON.stringify(allQuizzes));
			navigate("/quizzes", { state: { quizSetId } });
		} catch (error) {
			setUploadStatus("❌ " + error.message);
			navigate("/quizzes", { state: { error: error.message } });
		}
	};

	const handleNotesClick = async () => {
		setUploadStatus("⚙️ Generating notes...");
		const fileId = localStorage.getItem("file_id");
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
	
		const doGenerateNotes = async (token) =>
			await fetch("http://127.0.0.1:8000/api/generate-notes/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ file_id: fileId }),
			});
	
		try {
			let response = await doGenerateNotes(accessToken);
	
			if (response.status === 401) {
				const newAccessToken = await refreshAccessToken();
				response = await doGenerateNotes(newAccessToken);
			}
	
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "Failed to generate notes");
			}
	
			const data = await response.json();
			navigate("/notes", { state: { notes: data.notes } });
	
		} catch (error) {
			navigate("/notes", { state: { error: error.message } });
		}
	};
	const handleTutorAssistantClick = async () => {
		setUploadStatus("⚙️ Preparing Tutor Assistant...");
	
		const fileId = localStorage.getItem("file_id");
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
	
		const doIndexFile = async (token) =>
			await fetch("http://127.0.0.1:8000/api/index_pdf/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ file_id: fileId }),
			});
	
		try {
			let response = await doIndexFile(accessToken);
	
			if (response.status === 401) {
				const newAccessToken = await refreshAccessToken();
				response = await doIndexFile(newAccessToken);
			}
	
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error?.error || "Failed to prepare tutor assistant");
			}
	
			setUploadStatus("✅ Tutor Assistant is ready!");
			navigate("/tutor");
	
		} catch (error) {
			setUploadStatus("❌ " + error.message);
		}
	};	
	

	const handleCardClick = (action) => {
		const fileId = localStorage.getItem("file_id");
		if (!fileId) {
			alert("❗ Please upload a PDF first.");
			return;
		}
		action();
	};

	return (
		<div className="layout">
			<Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
			<main className="main-content">
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
						<h1 className="main-title">How do you want to study?</h1>
						<p className="tool-description">
						Master whatever you’re learning with LearnMate’s interactive flashcards, practice tests, and study activities.
						</p>
					</div>
					{/* <div className="upload-box">
						<input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} hidden />
						<label htmlFor="pdf-upload" className="choose-btn">📄 {file ? file.name : "Choose PDF"}</label>
						<button className="upload-btn" onClick={uploadFile} disabled={!file}>📤 Upload</button>
					</div> */}

					{uploadStatus && (
            <div className={`upload-message ${uploadStatus.startsWith("✅") ? "success-message" : 
                uploadStatus.startsWith("❌") || uploadStatus.startsWith("⚠️") ? "error-message" : "loading-message"}`}>
                {uploadStatus.startsWith("⚙️") && (<span className="spinner" />)}
							<span className="text">{uploadStatus.replace(/^✅ |^❌ |^⚠️ |^⚙️ /, "")}</span>
            </div>
          )}
				</div>

				<div className="cards-container">
					<div className="card flashcard-special"  onClick={() => handleCardClick(handleFlashcardsClick)}>
					<GiCardExchange size={40} className="card-icon flashcard-icon" />
						<h3>Flashcards Q/A</h3>
						<p>Quick review with generated questions and answers.</p>
					</div>
					<div className="card quizzes-special" onClick={() => handleCardClick(handleQuizzesClick)}>
					<MdQuiz size={40} className="card-icon quiz-icon" />
						<h3>Quizzes</h3>
						<p>Test your knowledge with AI-generated quizzes.</p>
					</div>
					<div className="card notes-special" onClick={() => handleCardClick(handleNotesClick)}>
	        <IoDocumentTextOutline size={40} className="card-icon" />
	          <h3>Important Notes</h3>
	          <p>Summarized key points extracted from your PDF.</p>
          </div>
		  <div className="card tutor-special" onClick={() => handleCardClick(handleTutorAssistantClick)}>

					<PiStudentFill size={40} className="card-icon" />
						<h3>Tutor Assistant</h3>
						<p>Interactive explanations and personalized help.</p>
					</div>
				</div>
				<div className="upload-box">
						<input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} hidden />
						<label htmlFor="pdf-upload" className="choose-btn">
						📄 {file ? file.name : "Choose PDF"}
						</label>
						<button className="upload-btn" onClick={uploadFile} disabled={!file}>📤 Upload</button>
					</div>
			</main>
		</div>
	);
}
