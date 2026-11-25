import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import RequireSetup from "@/components/layout/RequireSetup";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const buildCommit = process.env.NEXT_PUBLIC_BACMODS_GIT_COMMIT;

export const metadata: Metadata = {
  title: "BACMODS",
  description: "Unofficial timetable planner for SIT Applied Computing (BAC) students.",
  other: buildCommit ? { "bacmods-git-commit": buildCommit } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          <Suspense>
            <RequireSetup>{children}</RequireSetup>
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
