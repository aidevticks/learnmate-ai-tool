// src/pages/MyLibrary.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyLibrary.css";
import Sidebar from "../components/Sidebar";
import { FaTrashAlt } from "react-icons/fa";

export default function MyLibrary() {
	const [flashcardSets, setFlashcardSets] = useState([]);
	const [quizSets, setQuizSets] = useState([]);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("flashcards");
	const navigate = useNavigate();

	const toggleSidebar = () => setCollapsed(!collapsed);

	useEffect(() => {
		loadFlashcards();
		loadQuizzes();
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

	const loadQuizzes = () => {
		const storedQuizzes = localStorage.getItem("quizData");
		if (storedQuizzes) {
			const parsed = JSON.parse(storedQuizzes);
			setQuizSets(Object.entries(parsed));
		}
	};

	const deleteFlashcardSet = (setId) => {
		const stored = JSON.parse(localStorage.getItem("flashcardsData") || "{}");
		delete stored[setId];
		localStorage.setItem("flashcardsData", JSON.stringify(stored));
		setFlashcardSets(Object.entries(stored));
	};

	const deleteQuizSet = (setId) => {
		const stored = JSON.parse(localStorage.getItem("quizData") || "{}");
		delete stored[setId];
		localStorage.setItem("quizData", JSON.stringify(stored));
		setQuizSets(Object.entries(stored));
	};

	const openFlashcards = (flashcardSetId) => {
		navigate("/flashcards", {
			state: { flashcardSetId },
		});
	};

	const openQuiz = (quizSetId) => {
		navigate("/quizzes", {
			state: { quizSetId },
		});
	};

	return (
		<div className="layout">
			<Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
			<main className="main-content">
				<div className="library-header">
					<h1>Your library</h1>
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
						<span>Expert solutions</span>
						<span>Folders</span>
						<span>Classes</span>
					</div>
				</div>
				{flashcardSets.length === 0 && quizSets.length === 0 ? (
					<div className="empty-state">
						<img
							src="/your-placeholder.png"
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
						{activeTab === "flashcards" &&
							(flashcardSets.length === 0 ? (
		            <p className="empty-msg">You have no flashcard sets yet.</p>
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
							          Uploaded: {new Date(data.created_at).toLocaleString()}
						          </small>
					          </div>
				          </div>
			          ))}
		          </div>
	          ))}

						{/* Quiz Section */}
						{activeTab === "quizzes" &&
              (quizSets.length === 0 ? (
                <p className="empty-msg">You have no practice sets yet.</p>
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
              ))}
					</div>
				)}
			</main>
		</div>
	);
}
