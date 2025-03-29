// app/seller/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import SellerSidebar from "@/components/seller/SellerSidebar";
import SellerHeader from "@/components/seller/SellerHeader";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Check if user is a seller
  const convex = getConvexClient();
  const isSeller = await convex.query(api.users.isSeller, { userId });
  
  // If not a seller, check if superadmin (they can access both)
  if (!isSeller) {
    const isSuperAdmin = await convex.query(api.users.isSuperAdmin, { userId });
    if (isSuperAdmin) {
      // Allow superadmins to view seller dashboard
    } else {
      redirect("/"); // Redirect regular users to home
    }
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <SellerSidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <SellerHeader />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
