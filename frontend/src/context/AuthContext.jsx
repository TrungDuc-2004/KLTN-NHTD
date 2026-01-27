import React, { createContext, useContext, useMemo, useState } from "react";
import * as authService from "../services/authService";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [fullName, setFullName] = useState(localStorage.getItem("full_name") || "");

  const isAuthed = !!token;

  const value = useMemo(
    () => ({
      token,
      role,
      fullName,
      isAuthed,

      async login(username, password) {
        const data = await authService.login(username, password);
        localStorage.setItem("access_token", data.access_token || "");
        localStorage.setItem("role", data.role || "");
        localStorage.setItem("full_name", data.full_name || "");

        setToken(data.access_token || "");
        setRole(data.role || "");
        setFullName(data.full_name || "");
        return data;
      },

      logout() {
        authService.logout();
        setToken("");
        setRole("");
        setFullName("");
      },
    }),
    [token, role, fullName, isAuthed]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
