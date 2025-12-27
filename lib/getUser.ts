import { getCurrentUserId } from "./auth";
import { prisma } from "./prisma";

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: "RENTER" | "OWNER" | "ADMIN";
  preferredLocale: "EN" | "HE";
  preferredCurrency: "ILS" | "USD" | "EUR";
  stripeCustomerId: string | null;
  stripeConnectAccountId: string | null;
  stripeOnboardingComplete: boolean;
  stripeDetailsSubmitted: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
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
        preferredCurrency: true,
        stripeCustomerId: true,
        stripeConnectAccountId: true,
        stripeOnboardingComplete: true,
        stripeDetailsSubmitted: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
