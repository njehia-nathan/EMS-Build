"use client";

import DashboardStats from "@/components/admin/DashboardStats";
import RecentActivities from "@/components/admin/RecentActivities";

interface AdminDashboardClientProps {
  stats: any;
  recentEvents: any[];
  recentPayments: any[];
}

export default function AdminDashboardClient({ 
  stats, 
  recentEvents, 
  recentPayments 
}: AdminDashboardClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <DashboardStats stats={stats} />
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <RecentActivities title="Recent Events" data={recentEvents} type="events" />
          <RecentActivities title="Recent Payments" data={recentPayments} type="payments" />
        </div>
      </div>
    </div>
  );
}
