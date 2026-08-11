import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "UrbanPrice — Know what it's worth.",
  description: "Test build without Google Fonts network access.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-up-background text-up-text-primary">
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
