import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizon Recruiting | Internal Operations",
  description: "Production-quality internal operations platform and pipeline tracker for Recruiting teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative overflow-x-hidden min-h-screen">
        {/* Glowing backdrop elements */}
        <div className="glow-bg glow-purple" />
        <div className="glow-bg glow-indigo" />
        <div className="glow-bg glow-teal" />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
