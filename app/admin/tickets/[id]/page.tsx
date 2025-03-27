// app/admin/tickets/[id]/page.tsx
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TicketDetailClient from "@/components/admin/TicketDetailClient";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  try {
    const ticket = await convex.query(api.admin.getTicketById, { 
      ticketId: params.id as Id<"tickets"> 
    });
    
    const payment = await convex.query(api.admin.getTicketPayment, {
      ticketId: params.id as Id<"tickets">
    });
    
    return <TicketDetailClient ticket={ticket} payment={payment} />;
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return <TicketDetailClient error={`Could not find ticket with ID: ${params.id}`} />;
  }
}