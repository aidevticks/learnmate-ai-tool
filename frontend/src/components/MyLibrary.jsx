// src/pages/MyLibrary.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyLibrary.css";
import Sidebar from "../components/Sidebar";
import { FaTrashAlt } from "react-icons/fa";
import emptyImage from "../assets/empty-state.svg";

export default function MyLibrary() {
	const [flashcardSets, setFlashcardSets] = useState([]);
	const [quizSets, setQuizSets] = useState([]);
	const [noteSets, setNoteSets] = useState([]);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("flashcards");
	const navigate = useNavigate();

	const toggleSidebar = () => setCollapsed(!collapsed);

	useEffect(() => {
		loadFlashcards();
		loadQuizzes();
		loadNotes();
	}, []);

	const loadFlashcards = () => {
		const storedFlashcards = localStorage.getItem("flashcardsData");
		if (storedFlashcards) {
			const parsed = JSON.parse(storedFlashcards);
			const migrated = {};
			Object.entries(parsed).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					migrated[key] = {
						flashcards: value,
						created_at: new Date().toISOString(),
						file_id: key,
					};
				} else {
					migrated[key] = value;
				}
			});
			setFlashcardSets(Object.entries(migrated));
			localStorage.setItem("flashcardsData", JSON.stringify(migrated));
		}
	};

	const deleteFlashcardSet = (setId) => {
		const stored = JSON.parse(localStorage.getItem("flashcardsData") || "{}");
		delete stored[setId];
		localStorage.setItem("flashcardsData", JSON.stringify(stored));
		setFlashcardSets(Object.entries(stored));
	};

	const openFlashcards = (flashcardSetId) => {
		navigate("/flashcards", {
			state: { flashcardSetId },
		});
	};

	const loadQuizzes = () => {
		const storedQuizzes = localStorage.getItem("quizData");
		if (storedQuizzes) {
			const parsed = JSON.parse(storedQuizzes);
			setQuizSets(Object.entries(parsed));
		}
	};

	const deleteQuizSet = (setId) => {
		const stored = JSON.parse(localStorage.getItem("quizData") || "{}");
		delete stored[setId];
		localStorage.setItem("quizData", JSON.stringify(stored));
		setQuizSets(Object.entries(stored));
	};

	const openQuiz = (quizSetId) => {
		navigate("/quizzes", {
			state: { quizSetId },
		});
	};

	const loadNotes = () => {
		const storedNotes = localStorage.getItem("notesData");
		if (storedNotes) {
			const parsed = JSON.parse(storedNotes);
			setNoteSets(Object.entries(parsed));
		}
	};

	const deleteNoteSet = (setId) => {
		const stored = JSON.parse(localStorage.getItem("notesData") || "{}");
		delete stored[setId];
		localStorage.setItem("notesData", JSON.stringify(stored));
		setNoteSets(Object.entries(stored));
	};

	const openNotes = (noteSetId) => {
		const notesData = JSON.parse(localStorage.getItem("notesData") || "{}");
		const noteItem = notesData[noteSetId];
		console.log("Opening note with ID:", noteSetId);
	
		if (!noteItem) return;
	
		navigate("/notes", {
			state: {
				notes: noteItem.notes,
				noteSetId: noteSetId,
			},
		});
	};

	return (
		<div className="layout">
			<Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
			<main className="main-content">
				<div className="library-header">
					<h1>My library</h1>
					<div className="library-tabs">
						<span
							className={activeTab === "flashcards" ? "active-tab" : ""}
							onClick={() => setActiveTab("flashcards")}
						>
							Flashcard sets
						</span>
						<span
							className={activeTab === "quizzes" ? "active-tab" : ""}
							onClick={() => setActiveTab("quizzes")}
						>
							Practice tests
						</span>
						<span
							className={activeTab === "notes" ? "active-tab" : ""}
							onClick={() => setActiveTab("notes")}
						>
							Notes
						</span>
						<span>Folders</span>
						<span>Classes</span>
					</div>
				</div>
				{flashcardSets.length === 0 && quizSets.length === 0 && noteSets.length === 0 ? (
					<div className="empty-state">
						<img
							src={emptyImage}
							alt="No sets"
							className="empty-image"
						/>
						<h2>You have no sets yet</h2>
						<p>Sets you create or study will be displayed here</p>
						<button className="primary-btn">Create a set</button>
					</div>
				) : (
					<div className="library-wrapper">
						{/* Flashcard Section */}
						{activeTab === "flashcards" && (
							flashcardSets.length === 0 ? (
								<div className="empty-state">
									<img src={emptyImage} alt="No sets" className="empty-image" />
									<h2>You have no flashcard sets yet</h2>
									<p>Create or import flashcards to get started</p>
									<button className="primary-btn" onClick={() => navigate("/")}>
										Create a set
									</button>
								</div>
							) : (
								<div className="set-grid">
									{flashcardSets.map(([setId, data], index) => (
										<div className="set-card" key={setId}>
											<button
												className="delete-btn"
												onClick={() => deleteFlashcardSet(setId)}
												title="Delete"
											>
												<FaTrashAlt />
											</button>
											<div onClick={() => openFlashcards(setId)}>
												<h3>Set {index + 1}</h3>
												<p>{data.flashcards?.length || 0} cards</p>
												<small>
													{data.modified_at
														? `Modified: ${new Date(data.modified_at).toLocaleString()}`
														: `Saved: ${new Date(data.created_at).toLocaleString()}`}
												</small>
											</div>
										</div>
									))}
								</div>
							)
						)}

						{/* Quiz Section */}
						{activeTab === "quizzes" && (
							quizSets.length === 0 ? (
								<div className="empty-state">
									<img src={emptyImage} alt="No quizzes" className="empty-image" />
									<h2>You have no practice sets yet</h2>
									<p>Create or take quizzes to see them here</p>
									<button className="primary-btn" onClick={() => navigate("/")}>
										Create a quiz
									</button>
								</div>
							) : (
								<div className="set-grid">
									{quizSets.map(([setId, data], index) => {
										const score = data.score ?? 0;
										const total = data.total ?? 0;
										const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

										return (
											<div className="set-card" key={setId}>
												<button
													className="delete-btn"
													onClick={() => deleteQuizSet(setId)}
													title="Delete"
												>
													<FaTrashAlt />
												</button>
												<div onClick={() => openQuiz(setId)}>
													<h3>Practice {index + 1}</h3>
													<p>{total} questions</p>
													<p>Score: {score} / {total} ({percentage}%)</p>
													<div className="progress-bar">
														<div className="progress-fill" style={{ width: `${percentage}%` }}>
															<span className="progress-label">{percentage}%</span>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)
						)}
						{/* Notes Section */}
						{activeTab === "notes" && (
							noteSets.length === 0 ? (
								<div className="empty-state">
									<img src={emptyImage} alt="No notes" className="empty-image" />
									<h2>You have no saved notes yet</h2>
									<p>Your saved notes will be listed here</p>
									<button className="primary-btn" onClick={() => navigate("/")}>
										Create a note
									</button>
								</div>
							) : (
								<div className="set-grid">
									{noteSets.map(([setId, data], index) => (
										<div className="set-card" key={setId}>
											<button
												className="delete-btn"
												onClick={() => deleteNoteSet(setId)}
												title="Delete"
											>
												<FaTrashAlt />
											</button>
											<div onClick={() => openNotes(setId)}>
											  <h3>{data.title || `Notes ${index + 1}`}</h3>
												<p>{data.notes.length} characters</p>
												<small>
													{data.modified_at
														? `Modified: ${new Date(data.modified_at).toLocaleString()}`
														: `Saved: ${new Date(data.created_at).toLocaleString()}`}
												</small>
											</div>
										</div>
									))}
								</div>
							)
						)}
					</div>
				)}
			</main>
		</div>
	);
}
