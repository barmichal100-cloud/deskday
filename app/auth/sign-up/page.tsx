"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const roleSelection = formData.get("role") as string;

    // Map the selection to UserRole
    let role = "RENTER";
    if (roleSelection === "owner" || roleSelection === "both") {
      role = "OWNER"; // Users who want to list desks need OWNER role
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Redirect to the original destination or dashboard
      router.push(redirectUrl || "/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 relative">
          {/* Close button */}
          <Link
            href="/"
            className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          <div className="pt-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              Welcome to Deskday
            </h1>

            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <input
                  name="name"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Full name"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  required
                />
              </div>
              <div>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Email"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  required
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Password (min. 8 characters)"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <input
                  name="confirmPassword"
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <select
                  name="role"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
                  autoComplete="off"
                  required
                >
                  <option value="">I want to...</option>
                  <option value="owner">List my desks</option>
                  <option value="renter">Book desks</option>
                  <option value="both">Both list and book desks</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Continue"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-xs text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social login buttons */}
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <p className="text-xs text-gray-600 text-center mt-6">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-gray-900 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    }>
      <SignUpForm />
    </Suspense>
  );
}
