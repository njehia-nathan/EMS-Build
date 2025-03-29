import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import SellerDashboardClient from "@/components/seller/SellerDashboardClient";
import SellerHeader from "@/components/seller/SellerHeader";

// Create a Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function SellerDashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    return redirect("/sign-in");
  }
  
  // Check if user has seller role
  const userRecord = await convex.query(api.users.getUserById, {
    userId: user.id
  });
  
  if (!userRecord || userRecord.role !== "seller") {
    return redirect("/");
  }
  
  // Get seller events
  const events = await convex.query(api.seller.getSellerEvents, {
    sellerId: user.id
  });
  
  // Get seller payments
  const payments = await convex.query(api.seller.getSellerPayments, {
    sellerId: user.id
  });
  
  // Calculate dashboard stats
  const activeEvents = events.filter(event => event.status === "active").length;
  const totalRevenue = payments
    .filter(payment => payment.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const platformFees = payments
    .filter(payment => payment.status === "completed" && payment.platformFee)
    .reduce((sum, payment) => sum + (payment.platformFee || 0), 0);
  const netRevenue = totalRevenue - platformFees;
  
  // Get recent payments (last 5)
  const recentPayments = payments
    .filter(payment => payment.status === "completed")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);
  
  // Get recent events (last 5)
  const recentEvents = events
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 5);
  
  // Prepare dashboard data
  const dashboardData = {
    stats: {
      totalEvents: events.length,
      activeEvents,
      totalRevenue,
      platformFees,
      netRevenue
    },
    recentPayments,
    recentEvents
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <SellerHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SellerDashboardClient dashboardData={dashboardData} />
      </main>
    </div>
  );
}
