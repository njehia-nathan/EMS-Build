// app/admin/events/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import EventsTable from "@/components/admin/EventsTable";
import EventsFilter from "@/components/admin/EventsFilter";

async function EventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  const events = await convex.query(api.admin.getAllEvents);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
      </div>
      
      <EventsFilter />
      
      <div className="mt-4">
        <EventsTable events={events} />
      </div>
    </div>
  );
}

export default EventsPage;