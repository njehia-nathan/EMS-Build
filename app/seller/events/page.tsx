import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import SellerEventList from "@/components/seller/SellerEventList";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function SellerEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Verify user is a seller or superadmin
  const convex = getConvexClient();
  const isSeller = await convex.query(api.users.isSeller, { userId });
  const isSuperAdmin = await convex.query(api.users.isSuperAdmin, { userId });
  
  if (!isSeller && !isSuperAdmin) {
    redirect("/");
  }
  
  // Get seller events
  const events = await convex.query(api.seller.getSellerEvents, { sellerId: userId });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Events</h1>
          <Link
            href="/seller/new-event"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <SellerEventList events={events} />
        </div>
      </div>
    </div>
  );
}
