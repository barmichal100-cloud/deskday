import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import PasswordGate from "./PasswordGate";
import Footer from "./Footer";
import { getUser } from "@/lib/getUser";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const locale = user?.preferredLocale || "EN";
  const isRTL = locale === "HE";

  return (
    <html lang={locale.toLowerCase()} dir={isRTL ? "rtl" : "ltr"}>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <I18nProvider locale={locale}>
          <PasswordGate>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </PasswordGate>
        </I18nProvider>
      </body>
    </html>
  );
}
