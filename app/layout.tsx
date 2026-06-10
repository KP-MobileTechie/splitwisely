import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://splitwisely.vercel.app"),
  title: "splitwisely — split group expenses, settle up simply",
  description:
    "Track shared group expenses and get the minimum set of payments to settle up, with a debt-simplification algorithm. Next.js + Supabase.",
  openGraph: {
    title: "splitwisely",
    description: "Split group expenses and settle up with the fewest payments.",
    url: "https://splitwisely.vercel.app",
    siteName: "splitwisely",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
