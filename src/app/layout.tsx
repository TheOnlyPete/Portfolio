import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundFX from "@/components/BackgroundFX";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peter Murphy",
  description: "Software Engineer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* Dark wash ABOVE stone, BELOW stars */}
      <div className="fixed inset-0 pointer-events-none z-[0] bg-stone-wash" />

      {/* Stars / particles (z-[1] from BackgroundFX) */}
      <BackgroundFX />

      {/* Vignette ABOVE stars (so it affects everything) */}
      <div className="fixed inset-0 pointer-events-none z-[2] bg-vignette-overlay" />

      {/* Optional extra bloom/center lift */}
      <div className="fixed inset-0 pointer-events-none z-[3] bg-topbloom-overlay" />
      
      {/* Optional grain ABOVE everything except UI */}
      <div className="fixed inset-0 pointer-events-none z-[4] bg-grain-overlay" />

      {/* UI */}
      <div className="relative z-[10]">{children}</div>
    </body>

    </html>
  );
}
