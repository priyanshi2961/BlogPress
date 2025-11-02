import React, { createContext, useContext, useState, useEffect } from "react";
import { userApiService, setAuthToken } from "../services/api";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setAuthToken(storedToken);
        try {
          const userProfile = await userApiService.getProfile();
          setUser(userProfile);
        } catch (error) {
          console.error("Failed to get user profile:", error);
          localStorage.removeItem("token");
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (loginData) => {
    try {
      const response = await userApiService.login(loginData);
      const { token: newToken, userId, username, email } = response;

      setToken(newToken);
      setAuthToken(newToken);
      localStorage.setItem("token", newToken);

      // Get full user profile
      const userProfile = await userApiService.getProfile();
      setUser(userProfile);
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      await userApiService.register(registerData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
