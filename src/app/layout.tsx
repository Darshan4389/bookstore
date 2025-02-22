import { AuthProvider } from "@/context/AuthContext";
import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/Layout";

export const metadata: Metadata = {
  title: "BookStore App",
  description: "Manage books, inventory, and sales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
