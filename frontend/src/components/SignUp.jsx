import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}

		try {
			const response = await fetch("http://localhost:8000/api/auth/register/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, email, password, confirm_password: confirmPassword }),
			});

			const data = await response.json();

			if (response.ok && data.tokens && data.tokens.access) {
				alert("Registration successful! Please log in.");
				navigate("/login");
			} else {
				alert(data.error || "Registration failed");
			}
		} catch (error) {
			console.error("Registration error:", error);
			alert("Something went wrong. Please try again.");
		}
	};

	const styles = {
		page: {
			minHeight: "100vh",
			background: "linear-gradient(to right, #c3dafe, #a5b4fc)",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			fontFamily: "'Segoe UI', sans-serif",
		},
		card: {
			backgroundColor: "#fff",
			padding: "40px",
			borderRadius: "16px",
			boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
			width: "100%",
			maxWidth: "400px",
		},
		heading: {
			fontSize: "24px",
			fontWeight: "bold",
			marginBottom: "24px",
			textAlign: "center",
			color: "#4f46e5",
		},
		form: {
			display: "flex",
			flexDirection: "column",
		},
		label: {
			display: "block",
			marginBottom: "8px",
			color: "#333",
			fontSize: "14px",
		},
		input: {
			width: "100%",
			padding: "10px 14px",
			marginBottom: "16px",
			borderRadius: "8px",
			border: "1px solid #ccc",
			fontSize: "14px",
			outline: "none",
			boxSizing: "border-box",
		},
		button: {
			width: "100%",
			backgroundColor: "#4f46e5",
			color: "#fff",
			padding: "12px",
			fontSize: "16px",
			borderRadius: "8px",
			border: "none",
			cursor: "pointer",
			transition: "background-color 0.3s ease",
		},
		buttonHover: {
			backgroundColor: "#4338ca",
		},
		footerText: {
			marginTop: "16px",
			fontSize: "13px",
			textAlign: "center",
			color: "#555",
		},
		link: {
			color: "#4f46e5",
			textDecoration: "none",
			fontWeight: "500",
			marginLeft: "4px",
		},
	};

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				<h2 style={styles.heading}>Create Account</h2>
				<form onSubmit={handleSubmit} style={styles.form}>
					<label style={styles.label}>Username</label>
					<input
						type="text"
						style={styles.input}
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Enter your username"
						required
					/>

					<label style={styles.label}>Email</label>
					<input
						type="email"
						style={styles.input}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email"
						required
					/>

					<label style={styles.label}>Password</label>
					<input
						type="password"
						style={styles.input}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter your password"
						required
					/>

					<label style={styles.label}>Confirm Password</label>
					<input
						type="password"
						style={styles.input}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm your password"
						required
					/>

					<button
						type="submit"
						style={styles.button}
						onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
						onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
					>
						Sign Up
					</button>
				</form>
				<p style={styles.footerText}>
					Already have an account?
					<a href="/login" style={styles.link}>
						Log in
					</a>
				</p>
			</div>
		</div>
	);
}
