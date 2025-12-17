"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderClient from "../../HeaderClient";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
          });
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        setError("An error occurred while loading your profile");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <HeaderClient backHref="/profile" backText="Back to profile" />
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <HeaderClient backHref="/profile" backText="Back to profile" />
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Edit Profile
          </h1>
          <p className="text-sm text-gray-600">
            Update your account information
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            Profile updated successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
              placeholder="Enter your name"
            />
            <p className="mt-1 text-xs text-gray-600">
              This is how you'll appear to other users
            </p>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-600">
              Email cannot be changed. Contact support if you need assistance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
