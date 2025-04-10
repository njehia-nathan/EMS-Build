// app/admin/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  // Check if user is a superadmin
  const convex = getConvexClient();
  const isSuperAdmin = await convex.query(api.users.isSuperAdmin, { userId });
  
  // If not a superadmin, redirect to seller dashboard or home
  if (!isSuperAdmin) {
    const isSeller = await convex.query(api.users.isSeller, { userId });
    if (isSeller) {
      redirect("/seller"); // Redirect sellers to their dashboard
    } else {
      redirect("/"); // Redirect regular users to home
    }
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}