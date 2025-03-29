import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import SellerSalesClient from "@/components/seller/SellerSalesClient";

export default async function SellerSalesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Verify user is a seller or superadmin
  const convex = getConvexClient();
  const isSeller = await convex.query(api.users.isSeller, { userId });
  const isSuperAdmin = await convex.query(api.users.isSuperAdmin, { userId });
  
  if (!isSeller && !isSuperAdmin) {
    redirect("/");
  }
  
  // Get seller sales data
  const payments = await convex.query(api.seller.getSellerPayments, { sellerId: userId });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SellerSalesClient payments={payments} />
    </div>
  );
}
