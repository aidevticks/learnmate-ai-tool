// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (token && savedUsername) {
      setUser({ username: savedUsername });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (token, username) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("username", username);
    setToken(token);
    setUser({ username });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
