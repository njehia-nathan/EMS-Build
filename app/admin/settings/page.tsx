// app/admin/settings/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import SettingsTabs from "@/components/admin/SettingsTabs";

async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  const settings = await convex.query(api.admin.getSystemSettings);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm">
        <SettingsTabs settings={settings} />
      </div>
    </div>
  );
}

export default SettingsPage;