import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "./Quiz.css";
import Sidebar from "../components/Sidebar";

export default function Quiz() {
  const fileId = localStorage.getItem("file_id");
  const location = useLocation();
  const quizSetIdFromState = location.state?.quizSetId;
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pdfRef = useRef();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Quiz Score: ${calculateScore()} / ${quizData.length}`, 10, 10);

    quizData.forEach((q, idx) => {
      const y = 20 + idx * 20;
      const correctIndex = q.correct_answer.charCodeAt(0) - 65;
      const correctChoice = q.choices[correctIndex];
      doc.text(`Q${idx + 1}: ${q.question}`, 10, y);
      doc.text(`Answer: ${String.fromCharCode(65 + correctIndex)}. ${correctChoice}`, 10, y + 8);
    });

    doc.save("quiz_summary.pdf");
  };

  useEffect(() => {
    const loadQuiz = async () => {
      // ✅ Check for error from Home.jsx state
      if (location.state?.error) {
        setError(location.state.error);
        setLoading(false);
        return;
      }

      if (quizSetIdFromState) {
        const stored = JSON.parse(localStorage.getItem("quizData") || "{}");
        const set = stored[quizSetIdFromState];
        if (set) {
          setQuizData(set.quiz);
          localStorage.setItem("currentQuizSetId", quizSetIdFromState);
          setLoading(false);
          return;
        }
      }

      if (!fileId) {
        setError("⚠️ No file ID found. Please upload or select a file first.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          "http://localhost:8000/api/generate-quiz/",
          { file_id: fileId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        const quizSetId = `${fileId}_${Date.now()}`;
        const quizEntry = {
          quiz: response.data.quiz,
          created_at: new Date().toISOString(),
          file_id: fileId,
          score: null,
        };
        const existing = JSON.parse(localStorage.getItem("quizData") || "{}");
        existing[quizSetId] = quizEntry;
        localStorage.setItem("quizData", JSON.stringify(existing));
        localStorage.setItem("currentQuizSetId", quizSetId);

        setQuizData(response.data.quiz || []);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        setError("⚠️ Failed to load quiz data.");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

  const handleChoiceClick = (qIdx, cIdx) => {
    if (selectedAnswers[qIdx] !== undefined || isFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: cIdx }));
  };

  const calculateScore = () => {
    return quizData.reduce((score, item, idx) => {
      const correct = item.correct_answer.charCodeAt(0) - 65;
      return selectedAnswers[idx] === correct ? score + 1 : score;
    }, 0);
  };

  const finishQuiz = () => {
    const score = calculateScore();
    const percentage = Math.round((score / quizData.length) * 100);
    const setId = localStorage.getItem("currentQuizSetId");
    const all = JSON.parse(localStorage.getItem("quizData") || "{}");

    if (setId && all[setId]) {
      all[setId].score = score;
      all[setId].total = quizData.length;
      localStorage.setItem("quizData", JSON.stringify(all));
    }

    setIsFinished(true);
  };

  if (loading) return <p className="loading">⚙️ Quiz is generating, please wait...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!quizData.length) return <p className="error">❌ No quiz questions found.</p>;

  const currentQuestion = quizData[currentIndex];
  const correctIndex = currentQuestion.correct_answer.charCodeAt(0) - 65;
  const selected = selectedAnswers[currentIndex];
  const score = calculateScore();
  const percentage = Math.round((score / quizData.length) * 100);

  return (
    <div className="layout quiz-page">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <header className="quiz-header">
          <div className="controls">
            <button onClick={() => navigate("/")}>🏠 Home</button>
            <button onClick={exportPDF}>📄 Export PDF</button>
          </div>
        </header>
        <h2 className="page-subtitle">📝 Your Quiz</h2>
        <section ref={pdfRef} className="quiz-grid">
          <div className="quiz-card">
            <div className="quiz-question">
              <strong>Q{currentIndex + 1}:</strong> {currentQuestion.question}
            </div>
            <ul className="quiz-choices">
              {currentQuestion.choices.map((choice, i) => {
                const isCorrect = i === correctIndex;
                const isSelected = selected === i;
                let className = "quiz-choice";
                if (selected !== undefined) {
                  if (isCorrect && isSelected) className += " correct";
                  else if (isSelected && !isCorrect) className += " incorrect";
                }
                return (
                  <li
                    key={i}
                    className={className}
                    onClick={() => handleChoiceClick(currentIndex, i)}
                  >
                    {String.fromCharCode(65 + i)}. {choice.replace(/^[A-D]\.\s*/, "")}
                  </li>
                );
              })}
            </ul>
            {selected !== undefined && (
              <div className="quiz-answer">
                {selected === correctIndex
                  ? "✅ Correct!"
                  : `❌ Incorrect. Correct Answer: ${String.fromCharCode(65 + correctIndex)}. ${currentQuestion.choices[correctIndex]}`}
              </div>
            )}
            <div className="nav-buttons">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                ⬅️ Previous
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, quizData.length - 1))}
                disabled={currentIndex === quizData.length - 1}
              >
                Next ➡️
              </button>
            </div>
            {currentIndex === quizData.length - 1 && !isFinished && (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button className="finish-button" onClick={finishQuiz}>
                  ✅ Finish Quiz
                </button>
              </div>
            )}
            {isFinished && (
              <div className="quiz-score animated">
                🎯 You scored {score} / {quizData.length} ({percentage}%)
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
