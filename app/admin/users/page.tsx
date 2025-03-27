// app/admin/users/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import UsersTable from "@/components/admin/UsersTable";
import UserFilter from "@/components/admin/UserFilter";

async function UsersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  const users = await convex.query(api.admin.getAllUsers);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      
      <UserFilter />
      
      <div className="mt-4">
        <UsersTable users={users} />
      </div>
    </div>
  );
}

export default UsersPage;