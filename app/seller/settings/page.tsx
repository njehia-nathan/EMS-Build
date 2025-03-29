import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import SellerSettingsClient from "@/components/seller/SellerSettingsClient";

export default async function SellerSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Verify user is a seller or superadmin
  const convex = getConvexClient();
  const isSeller = await convex.query(api.users.isSeller, { userId });
  const isSuperAdmin = await convex.query(api.users.isSuperAdmin, { userId });
  
  if (!isSeller && !isSuperAdmin) {
    redirect("/");
  }
  
  // Get user data
  const user = await convex.query(api.users.getUserById, { userId });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SellerSettingsClient user={user} />
    </div>
  );
}
