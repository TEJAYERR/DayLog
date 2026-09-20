import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/api/auth";

import { ApiError } from "@/api/client";
import { useLocation } from "wouter";

type User = {
  name?: string;
  email?: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getToken = (response: {
  token?: string;
  jwt?: string;
}) => {
  return response.token || response.jwt || "";
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("daylog_token");
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("daylog_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const handleUnauthorized = () => {
    localStorage.removeItem("daylog_token");
    localStorage.removeItem("daylog_user");

    setToken(null);
    setUser(null);

    setLocation("/login");
  };

  const signIn = async (email: string, password: string) => {
    const result = await loginRequest({
      email,
      password,
    });

    console.log("Login response:", result);

    const nextToken = getToken(result);

    console.log("JWT token:", nextToken);

    if (!nextToken) {
      throw new ApiError(
        "We did not receive a valid session. Please try again."
      );
    }

    // Store JWT immediately
    localStorage.setItem("daylog_token", nextToken);

    // Update React state
    setToken(nextToken);

    const nextUser = result.user || {
      name: result.name,
      email: result.email || email,
    };

    localStorage.setItem(
      "daylog_user",
      JSON.stringify(nextUser)
    );

    setUser(nextUser);

    setLocation("/");
  };

  const signUp = async (
    name: string,
    email: string,
    password: string
  ) => {
    const result = await registerRequest({
      name,
      email,
      password,
    });

    console.log("Register response:", result);

    const nextToken = getToken(result);

    console.log("JWT token:", nextToken);

    if (!nextToken) {
      throw new ApiError(
        "We did not receive a valid session. Please try again."
      );
    }

    // Store JWT immediately
    localStorage.setItem("daylog_token", nextToken);

    // Update React state
    setToken(nextToken);

    const nextUser = result.user || {
      name: result.name || name,
      email: result.email || email,
    };

    localStorage.setItem(
      "daylog_user",
      JSON.stringify(nextUser)
    );

    setUser(nextUser);

    setLocation("/");
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } catch {
      // Clear local session even if backend is unavailable
    }

    handleUnauthorized();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      signIn,
      signUp,
      signOut,
      handleUnauthorized,
    }),
    [token, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}