// src/components/Quiz.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "./Quiz.css";
import Sidebar from "../components/Sidebar";

export default function Quiz() {
	const fileId = localStorage.getItem("file_id");
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

	const quizSetId = `${fileId}_${Date.now()}`;
  const existingData = JSON.parse(localStorage.getItem("quizData") || "{}");

  existingData[quizSetId] = {
    quiz: response.data.quiz,
    created_at: new Date().toISOString(),
    file_id: fileId,
    score: null, // initially null
  };

  localStorage.setItem("quizData", JSON.stringify(existingData));
  localStorage.setItem("currentQuizSetId", quizSetId); // Save current setId separately

	useEffect(() => {
		const fetchQuiz = async () => {
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
				setQuizData(response.data.quiz || []);
			} catch (err) {
				console.error("Quiz fetch error:", err);
				setError("⚠️ Failed to load quiz data.");
			} finally {
				setLoading(false);
			}
		};

		fetchQuiz();
	}, [fileId]);

	const handleChoiceClick = (questionIndex, choiceIndex) => {
		if (selectedAnswers[questionIndex] !== undefined || isFinished) return;
		setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: choiceIndex }));
	};

	const nextQuestion = () => {
		if (currentIndex < quizData.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const prevQuestion = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const calculateScore = () => {
		let score = 0;
		quizData.forEach((item, idx) => {
			const correctIndex = item.correct_answer.charCodeAt(0) - 65;
			if (selectedAnswers[idx] === correctIndex) score++;
		});
		return score;
	};

	const exportPDF = () => {
		const pdf = new jsPDF("p", "mm", "a4");
		const marginLeft = 10;
		const lineHeight = 10;
		const pageHeight = pdf.internal.pageSize.getHeight();
		let y = 10;

		quizData.forEach((item, idx) => {
			const question = `Q${idx + 1}: ${item.question}`;
			const choices = item.choices.map((choice) => `${choice}`);
			const correctChoice = `${item.correct_answer}`;
			const answer = `✅ Correct: ${correctChoice}`;

			const allText = [question, ...choices, answer];
			const splitText = pdf.splitTextToSize(allText.join("\n"), 180);

			if (y + splitText.length * lineHeight > pageHeight - 10) {
				pdf.addPage();
				y = 10;
			}

			pdf.text(splitText, marginLeft, y);
			y += splitText.length * lineHeight + 5;
		});

		pdf.save("quiz.pdf");
	};

	if (loading) return <p className="loading">⚙️ Quiz is generating, please wait...</p>;
	if (error) return <p className="error">{error}</p>;
	if (!quizData.length) return <p className="error">❌ No quiz questions found.</p>;

	const currentQuestion = quizData?.[currentIndex];
	const correctIndex = currentQuestion.correct_answer.charCodeAt(0) - 65;
	const selected = selectedAnswers[currentIndex];
	const score = calculateScore();
	const percentage = Math.round((score / quizData.length) * 100);

	return (
		<div className="layout quiz-page">
			<Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />

			<main className="main-content">
				<header className="quiz-header">
					<div className="header-spacer" />
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
								const isSelected = selected === i;
								const isCorrect = i === correctIndex;

								let className = "quiz-choice";
								if (selected !== undefined) {
									if (isSelected && isCorrect) className += " correct";
									else if (isSelected && !isCorrect) className += " incorrect";
								}

								const cleanChoice = choice.replace(/^[A-D]\.\s*/, "");

								return (
									<li
										key={i}
										className={className}
										onClick={() => handleChoiceClick(currentIndex, i)}
									>
										{String.fromCharCode(65 + i)}. {cleanChoice}
									</li>
								);
							})}
						</ul>

						{selected !== undefined && (
							<div className="quiz-answer">
								{selected === correctIndex
									? "✅ Correct!"
									: `❌ Incorrect. Correct Answer: ${currentQuestion.choices[correctIndex]}`}
							</div>
						)}

						<div className="nav-buttons">
							<button onClick={prevQuestion} disabled={currentIndex === 0}>
								⬅️ Previous
							</button>
							<button onClick={nextQuestion} disabled={currentIndex === quizData.length - 1}>
								Next ➡️
							</button>
						</div>

						{currentIndex === quizData.length - 1 && !isFinished && (
							<div style={{ marginTop: "20px", textAlign: "center" }}>
								<button
									className="finish-button"
									onClick={() => {
										const score = calculateScore();
		                const total = quizData.length;
		                const fileId = localStorage.getItem("file_id");
		                const quizId = `${fileId}_${Date.now()}`;

                	 	const quizEntry = {
		                	quiz: quizData,
			                created_at: new Date().toISOString(),
			                file_id: fileId,
			                score,
			                total
		                };

		                const existingData = JSON.parse(localStorage.getItem("quizData") || "{}");
		                existingData[quizId] = quizEntry;
		                localStorage.setItem("quizData", JSON.stringify(existingData));

		              setIsFinished(true);
	                }}
                >
	             ✅ Finish Quiz 
              </button>
							</div>
						)}

						{isFinished && (
							<div className="quiz-score animated">
								🎯 You scored {score} / {quizData.length} ({percentage}%)
								<div className="progress-bar">
									<div
										className="progress-fill"
										style={{ width: `${percentage}%` }}
									></div>
								</div>
							</div>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}
