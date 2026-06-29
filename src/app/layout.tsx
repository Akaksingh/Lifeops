import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LemmaShell from "@/components/LemmaShell";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Life Ops — Command Centre",
  description: "Your tasks, deadlines, follow-ups and open loops in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LemmaShell>{children}</LemmaShell>
      </body>
    </html>
  );
}
