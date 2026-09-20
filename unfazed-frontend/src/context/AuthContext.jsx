import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password, role) => {
    const endpoint =
      role === "client"
        ? "/auth/client/login"
        : "/auth/therapist/login";

    const response = await axiosInstance.post(endpoint, {
      email,
      password,
    });

    const token = response.data.data.token;

    localStorage.setItem("token", token);

    const loggedInUser =
      role === "client"
        ? response.data.data.client
        : response.data.data.therapist;

    setUser(loggedInUser);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const loadCurrentUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to restore authentication:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}