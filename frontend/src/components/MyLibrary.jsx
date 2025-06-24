// src/pages/MyLibrary.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyLibrary.css";
import Sidebar from "../components/Sidebar";

export default function MyLibrary() {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [quizSets, setQuizSets] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setCollapsed(!collapsed);

  useEffect(() => {
    // Load Flashcards
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

    // Load Quizzes
    const storedQuizzes = localStorage.getItem("quizData");
    if (storedQuizzes) {
      const parsed = JSON.parse(storedQuizzes);
      setQuizSets(Object.entries(parsed));
    }
  }, []);

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
        <h1 className="library-heading">📚 My Library</h1>

        {/* Flashcard Sets */}
        <section className="library-section">
          <h2>🧠 Flashcard Sets</h2>
          {flashcardSets.length === 0 ? (
            <p className="empty-msg">You have no flashcard sets yet.</p>
          ) : (
            <div className="set-grid">
              {flashcardSets.map(([setId, data], index) => (
                <div
                  className="set-card"
                  key={setId}
                  onClick={() => openFlashcards(setId)}
                >
                  <h3>Set {index + 1}</h3>
                  <p>{data.flashcards?.length || 0} cards</p>
                  <small>Uploaded: {new Date(data.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quiz Sets */}
        <section className="library-section">
          <h2>📝 Practice Sets</h2>
          {quizSets.length === 0 ? (
            <p className="empty-msg">You have no practice sets yet.</p>
          ) : (
            <div className="set-grid">
              {quizSets.map(([setId, data], index) => {
                const score = data.score;
                const total = data.total;
                const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

                return (
                  <div
                    className="set-card"
                    key={setId}
                    onClick={() => openQuiz(setId)}
                  >
                    <h3>Practice {index + 1}</h3>
                    <p>{total} questions</p>
                    <p>Score: {score} / {total}</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
