// app/admin/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  // Fetch stats for the dashboard
  const stats = await convex.query(api.admin.getDashboardStats);
  const recentEvents = await convex.query(api.admin.getRecentEvents);
  const recentPayments = await convex.query(api.admin.getRecentPayments);
  
  return (
    <AdminDashboardClient 
      stats={stats} 
      recentEvents={recentEvents} 
      recentPayments={recentPayments} 
    />
  );
}