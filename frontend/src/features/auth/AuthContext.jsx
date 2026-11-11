import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession, setSession } from "./session.js";
import { post, request } from "../../api/client.js";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, update] = useState(getSession);
  useEffect(() => {
    const listener = () => update(getSession());
    window.addEventListener("cartora:session", listener);
    return () => window.removeEventListener("cartora:session", listener);
  }, []);
  async function authenticate(mode, body) {
    const result = await request(`accounts/${mode}/`, {
      method: "POST",
      body,
      auth: false,
    });
    setSession(result);
  }
  async function logout() {
    try {
      await post("accounts/logout/", { refresh: getSession()?.refresh });
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    setSession(null);
  }
  return (
    <AuthContext.Provider value={{ user: session?.user, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
