import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./Providers";

export const metadata = {
  title: "ATS Resume Checker",
  description: "AI powered resume analysis",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}