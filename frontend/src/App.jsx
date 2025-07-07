// src/App.jsx
import React from "react";
import "./index.css";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";
import SignUp from "./components/SignUp.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Flashcards from "./components/Flashcards.jsx"; // ✅ Uncomment this
import Quiz from "./components/Quiz.jsx";
import MyLibrary from "./components/MyLibrary";
import ImportantNotes from "./components/ImportantNotes.jsx";
import TutorAssistant from "./components/TutorAssistant"; 
import Pricing from "./components/Pricing";
import About from "./components/About";


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flashcards"
        element={
          <ProtectedRoute>
            <Flashcards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <ImportantNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor"
        element={
          <ProtectedRoute>
            <TutorAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <Pricing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />
      <Route path="/library" element={<MyLibrary />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
    </Routes>
  );
}

export default App;
