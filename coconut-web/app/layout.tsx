import type { Metadata } from "next";
import { Inter, Boldonse, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// Inter as your main Sans font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Boldonse as your Mono font
const boldonse = Boldonse({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Coconut-Chats",
  description: "Created by programmerAyush",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      /* Use backticks here to combine the variables and layout classes */
      className={cn("h-full", "antialiased", inter.variable, boldonse.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}