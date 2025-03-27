// components/admin/DashboardStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, Ticket, CreditCard } from "lucide-react";

type StatsProps = {
  stats: {
    totalEvents: number;
    totalUsers: number;
    totalTicketsSold: number;
    totalRevenue: number;
    activeEvents: number;
    newUsersToday: number;
    ticketsSoldToday: number;
    revenueToday: number;
  };
};

export default function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="rounded-full p-3 bg-blue-100">
            <CalendarDays className="h-6 w-6 text-blue-700" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Events</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalEvents}</p>
            <p className="text-sm text-gray-500">{stats.activeEvents} active</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="rounded-full p-3 bg-green-100">
            <Users className="h-6 w-6 text-green-700" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Users</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500">+{stats.newUsersToday} today</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="rounded-full p-3 bg-amber-100">
            <Ticket className="h-6 w-6 text-amber-700" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tickets Sold</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalTicketsSold}</p>
            <p className="text-sm text-gray-500">+{stats.ticketsSoldToday} today</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <div className="rounded-full p-3 bg-purple-100">
            <CreditCard className="h-6 w-6 text-purple-700" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Revenue</p>
            <p className="text-3xl font-semibold text-gray-900">KSh {stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">KSh {stats.revenueToday.toLocaleString()} today</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}