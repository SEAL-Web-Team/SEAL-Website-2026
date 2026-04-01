import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEAL — Sensors, Energy, and Automation Laboratory",
  description:
    "SEAL applies core expertise in sensors, energy, and automation to solve problems in medicine, avionics, wearable tech, defense, energy, and sustainability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/8 bg-black/10 py-6 px-4 text-center backdrop-blur-[2px]">
          <p className="text-slate-500 text-sm">© 2026 SEAL. All Rights Reserved.</p>
        </footer>
      </body>
    </html>
  );
}
