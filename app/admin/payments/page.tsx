// app/admin/payments/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import PaymentsPageClient from "@/components/admin/PaymentsPageClient";

export default async function PaymentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  const payments = await convex.query(api.admin.getAllPayments);
  const stats = await convex.query(api.admin.getPaymentStats);
  
  return <PaymentsPageClient payments={payments} stats={stats} />;
}