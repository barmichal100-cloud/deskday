"use client";

import { useState, useEffect } from "react";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user already authenticated in this session
    const authenticated = sessionStorage.getItem("site_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_SITE_PASSWORD;

    // Debug logging (remove after testing)
    console.log("Password check:", {
      hasPassword: !!correctPassword,
      passwordLength: correctPassword?.length,
      enteredLength: password.length,
    });

    if (!correctPassword) {
      // No password set - show error instead of allowing access
      setError("Password protection is not configured. Please contact the administrator.");
      setPassword("");
      return;
    }

    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("site_authenticated", "true");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🔒 Site Access
              </h1>
              <p className="text-sm text-gray-600">
                This site is currently under development.
                <br />
                Please enter the password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Enter password"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-base font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition"
              >
                Access Site
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              Contact the site administrator if you need access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
