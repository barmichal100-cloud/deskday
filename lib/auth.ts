import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// JWT secret - MUST be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("WARNING: JWT_SECRET is not set in production!");
}

interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Get current user ID from session
 * Checks JWT token from httpOnly cookie
 */
export async function getCurrentUserId(req?: Request): Promise<string | null> {
  try {
    // First check header (useful for automated tests or local requests)
    const headerId = req?.headers?.get("x-user-id");
    if (headerId) return headerId;

    // In development allow a dev user via env var for local testing
    if (process.env.NODE_ENV !== "production" && process.env.DEV_USER_ID) {
      return process.env.DEV_USER_ID;
    }

    // Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded.userId;
  } catch (error) {
    // Token is invalid or expired
    console.error("Error getting user ID from session:", error);
    return null;
  }
}

/**
 * Create a new session for a user
 * Sets httpOnly cookie with JWT token
 */
export async function createSession(
  response: NextResponse,
  userId: string
): Promise<void> {
  // Create JWT token (expires in 7 days)
  const token = jwt.sign(
    { userId } as TokenPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Set httpOnly cookie with secure flags
  response.cookies.set("auth_token", token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Destroy user session
 * Removes auth cookie
 */
export function destroySession(response: NextResponse): void {
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });
}
