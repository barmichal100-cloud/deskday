import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import PasswordGate from "./PasswordGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Deskday",
  description: "Find a desk for a day in real offices.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <PasswordGate>
          {children}
        </PasswordGate>
      </body>
    </html>
  );
}
