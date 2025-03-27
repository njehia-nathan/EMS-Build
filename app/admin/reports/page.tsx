// app/admin/reports/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import RevenueChart from "@/components/admin/RevenueChart";
import EventsPerformance from "@/components/admin/EventsPerformance";
import SalesOverview from "@/components/admin/SalesOverview";
import UserGrowthChart from "@/components/admin/UserGrowthChart";
import ReportDateFilter from "@/components/admin/ReportDateFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  // Fetch analytics data
  const salesData = await convex.query(api.admin.getSalesAnalytics);
  const eventsData = await convex.query(api.admin.getEventsAnalytics);
  const userGrowthData = await convex.query(api.admin.getUserGrowthAnalytics);
  const topSellingEvents = await convex.query(api.admin.getTopSellingEvents);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      </div>
      
      <ReportDateFilter />
      
      <Tabs defaultValue="revenue" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
              <RevenueChart data={salesData.revenueByPeriod} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Revenue by Payment Method</h2>
                <SalesOverview data={salesData.revenueByMethod} type="paymentMethod" />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Sales by Time of Day</h2>
                <SalesOverview data={salesData.salesByTimeOfDay} type="timeOfDay" />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Events Created Over Time</h2>
              <RevenueChart data={eventsData.eventsByPeriod} type="events" />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Top Performing Events</h2>
              <EventsPerformance events={topSellingEvents} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Events by Category</h2>
                <SalesOverview data={eventsData.eventsByCategory} type="category" />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Event Fill Rate</h2>
                <SalesOverview data={eventsData.eventFillRate} type="fillRate" />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">User Growth</h2>
              <UserGrowthChart data={userGrowthData.userGrowthByPeriod} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">User Activity</h2>
                <SalesOverview data={userGrowthData.userActivityDistribution} type="activity" />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Average Spend per User</h2>
                <SalesOverview data={userGrowthData.averageSpendByUserType} type="spend" />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Platform Growth</h2>
              <RevenueChart data={salesData.platformGrowth} type="overview" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Conversion Rate</h2>
                <SalesOverview data={salesData.conversionMetrics} type="conversion" />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Refund Rate</h2>
                <SalesOverview data={salesData.refundMetrics} type="refund" />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Ticket Utilization</h2>
                <SalesOverview data={eventsData.ticketUtilization} type="utilization" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReportsPage;