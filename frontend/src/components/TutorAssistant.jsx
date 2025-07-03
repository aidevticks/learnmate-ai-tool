import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaRobot } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./TutorAssistant.css";

export default function TutorAssistant() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const chatEndRef = useRef(null);

	const navigate = useNavigate();
	const fileId = localStorage.getItem("file_id");
	const accessToken = localStorage.getItem("access_token");

	useEffect(() => {
		if (!fileId || !accessToken) {
			navigate("/home");
			return;
		}
		const history = JSON.parse(localStorage.getItem(`tutor_chat_${fileId}`)) || [];
		setMessages(history);
		setSuggestions([
			"Summarize this document",
			"What are the key takeaways?",
			"Give me 5 quiz questions",
			"What’s the purpose of this content?",
		]);
		setCheckingAuth(false);
	}, [fileId, accessToken, navigate]);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (checkingAuth) return null;

	const sendMessage = async (query) => {
		if (!query.trim()) return;

		const newMessages = [...messages, { sender: "user", text: query }];
		setMessages(newMessages);
		setInput("");
		setLoading(true);

		let token = accessToken;
		const refreshToken = localStorage.getItem("refresh_token");

		// Prepare history payload for conversational chain
		const historyPayload = newMessages.map((msg) => ({
			role: msg.sender === "user" ? "user" : "bot",
			content: msg.text,
		}));

		// Refresh access token if expired
		const refreshAccessToken = async () => {
			try {
				const res = await fetch("http://localhost:8000/api/refresh_token/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refresh: refreshToken }),
				});
				if (!res.ok) throw new Error("Refresh failed");
				const data = await res.json();
				localStorage.setItem("access_token", data.access);
				return data.access;
			} catch (err) {
				localStorage.clear();
				navigate("/login");
				throw new Error("Session expired");
			}
		};

		// Send chat request
		const doChatRequest = async (tokenToUse) => {
			return await fetch("http://127.0.0.1:8000/api/chat_with_pdf/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tokenToUse}`,
				},
				body: JSON.stringify({
					file_id: fileId,
					question: query,
					history: historyPayload,
				}),
			});
		};

		try {
			let res = await doChatRequest(token);
			if (res.status === 401) {
				token = await refreshAccessToken();
				res = await doChatRequest(token);
			}
			if (!res.ok) throw new Error("Something went wrong");

			const data = await res.json();
			const botResponse = data.answer || "🤖 No response found.";
			const updatedMessages = [...newMessages, { sender: "bot", text: botResponse }];

			setMessages(updatedMessages);
			localStorage.setItem(`tutor_chat_${fileId}`, JSON.stringify(updatedMessages));
		} catch (err) {
			setMessages((prev) => [...prev, { sender: "bot", text: `❌ ${err.message}` }]);
		}
		setLoading(false);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		sendMessage(input);
	};

	const handleSuggestionClick = (text) => {
		sendMessage(text);
	};

	const toggleSidebar = () => setCollapsed(!collapsed);

	return (
		<div className="layout">
			<Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
			<main className="main-content">
				<header className="notes-header">
					<div className="header-spacer" />
				</header>

				<h2 className="page-subtitle">Tutor Assistant</h2>
                <p className="assistant-description">
                💡 Ask questions related only to the content of your uploaded PDF. The assistant is trained specifically on your document.
                </p>

				<div className="chat-container">
					<div className="chat-messages">
						{messages.map((msg, index) => (
							<div key={index} className={`chat-row ${msg.sender}`}>
                                <div className="chat-icon">
                                    {msg.sender === "user" ? <FaUserCircle size={24} /> : <FaRobot size={24} />}
                                </div>
                                <div className={`chat-bubble ${msg.sender}`}>
                                    {msg.text}
                                </div>
                            </div>
						))}
						{loading && <div className="chat-bubble bot">Typing...</div>}
						<div ref={chatEndRef} />
					</div>

					<form className="chat-input-bar" onSubmit={handleSubmit}>
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Ask your Tutor Assistant..."
							required
						/>
						<button type="submit">Send</button>
					</form>

					<div className="suggestions-bar">
						{suggestions.map((suggestion, i) => (
							<button key={i} className="suggestion-btn" onClick={() => handleSuggestionClick(suggestion)}>
								{suggestion}
							</button>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
