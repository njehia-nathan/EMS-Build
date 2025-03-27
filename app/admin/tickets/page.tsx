// app/admin/tickets/page.tsx
import TicketsPageClient from "@/components/admin/TicketsPageClient";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TicketsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  const tickets = await convex.query(api.admin.getAllTickets);
  
  return <TicketsPageClient initialTickets={tickets} />;
}