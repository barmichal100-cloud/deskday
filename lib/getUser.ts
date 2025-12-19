import { getCurrentUserId } from "./auth";
import { prisma } from "./prisma";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: "RENTER" | "OWNER" | "ADMIN";
  preferredLocale: "EN" | "HE";
  stripeCustomerId: string | null;
  stripeAccountId: string | null;
};

export async function getUser(): Promise<User | null> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLocale: true,
        stripeCustomerId: true,
        stripeAccountId: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
