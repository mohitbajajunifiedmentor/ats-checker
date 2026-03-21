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
      <body className="bg-[#030712] min-h-screen text-slate-100" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}