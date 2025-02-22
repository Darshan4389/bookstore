"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login"); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}!</p>
    </div>
  );
}
