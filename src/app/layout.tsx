import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricketPulse Dashboard",
  description: "AI-powered Cricket Betting Analytics SaaS Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: 'light' }} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning style={{ background: '#f8fafc', color: '#0f172a' }} className="min-h-full flex text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64 min-h-screen bg-[#f8fafc]">
          <Topbar />
          <main className="flex-1 p-6 overflow-auto bg-[#f8fafc] text-slate-900">
            <Providers>
              {children}
            </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
