// src/components/Flashcards.jsx
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Flashcards.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as html2pdf from "html2pdf.js";
import { useRef } from "react";

export default function Flashcards() {
  const location = useLocation();
  const { loading, error } = location.state || {};
  const fileId = localStorage.getItem("file_id");

  const [revealed, setRevealed] = useState({});
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const allFlashcards = JSON.parse(localStorage.getItem("flashcardsData") || "{}");
  const flashcards = allFlashcards[fileId] || [];

  const toggleReveal = (idx) => {
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  // Inside component
  const pdfRef = useRef();

  const exportPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const marginLeft = 10;
    const lineHeight = 10;
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    let y = 10;
  
    flashcards.forEach((card, idx) => {
      const question = `Q${idx + 1}: ${card.question}`;
      const answer = `Answer: ${card.answer}`;
  
      const splitQuestion = pdf.splitTextToSize(question, 180);
      const splitAnswer = pdf.splitTextToSize(answer, 180);
  
      if (y + splitQuestion.length * lineHeight + splitAnswer.length * lineHeight > pageHeight - 10) {
        pdf.addPage();
        y = 10;
      }
  
      pdf.text(splitQuestion, marginLeft, y);
      y += splitQuestion.length * lineHeight;
  
      pdf.text(splitAnswer, marginLeft, y);
      y += splitAnswer.length * lineHeight + 5;
    });
  
    pdf.save("flashcards.pdf");
  };

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  if (loading) return <p className="loading">⚙️ Flashcards are generating, please wait...</p>;
  if (error) return <p className="error">❌ Error: {error}</p>;

  return (
    <div className="flashcards-page">
      <header className="flashcards-header">
        <h1 className="app-title">🚀 LearnMate</h1>
        <div className="controls">
          <button onClick={toggleDarkMode}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </header>
      <h2 className="page-subtitle">🧠 Your Flashcards</h2>

      <section ref={pdfRef} id="flashcards-container" className="flashcards-grid">
        {flashcards.length === 0 ? (
          <p>No flashcards available for this file.</p>
        ) : (
          flashcards.map((card, idx) => (
            <div
              key={idx}
              className={`flashcard ${revealed[idx] ? "flipped" : ""}`}
              onClick={() => toggleReveal(idx)}
            >
              <div className="flashcard-question">
                <strong>Q{idx + 1}:</strong> {card.question}
              </div>
              <div className={`flashcard-answer ${revealed[idx] ? "visible" : ""}`}>
                <strong>Answer:</strong> {card.answer}
              </div>
              <div className="flashcard-footer">
                {revealed[idx] ? "👆 Tap to hide" : "👇 Tap to reveal"}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
