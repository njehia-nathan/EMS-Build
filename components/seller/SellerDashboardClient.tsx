'use client';

import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  Tag
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface SellerDashboardProps {
  dashboardData: {
    stats: {
      totalEvents: number;
      activeEvents: number;
      totalRevenue: number;
      platformFees: number;
      netRevenue: number;
    };
    recentPayments: any[];
    recentEvents: any[];
  };
}

export default function SellerDashboardClient({ dashboardData }: SellerDashboardProps) {
  const { stats, recentPayments, recentEvents } = dashboardData;
  
  // Format currency
  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900">Seller Dashboard</h1>
      
      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Events */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/seller/events" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all events
              </Link>
            </div>
          </div>
        </div>
        
        {/* Active Events */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.activeEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/seller/events" className="font-medium text-indigo-600 hover:text-indigo-500">
                View active events
              </Link>
            </div>
          </div>
        </div>
        
        {/* Total Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(stats.totalRevenue)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/seller/sales" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all sales
              </Link>
            </div>
          </div>
        </div>
        
        {/* Platform Fees */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Platform Fees</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(stats.platformFees)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-gray-500">
                Commission on sales
              </span>
            </div>
          </div>
        </div>
        
        {/* Net Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Revenue</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(stats.netRevenue)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/seller/payouts" className="font-medium text-indigo-600 hover:text-indigo-500">
                View payouts
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Sales</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <li key={payment._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {payment.eventName || "Ticket Purchase"}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${payment.status === "completed" ? "bg-green-100 text-green-800" : 
                            payment.status === "refunded" ? "bg-red-100 text-red-800" : 
                            "bg-yellow-100 text-yellow-800"}`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <DollarSign className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No recent sales
              </li>
            )}
          </ul>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/seller/sales" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all sales
              </Link>
            </div>
          </div>
        </div>
        
        {/* Recent Events */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Events</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <li key={event._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {event.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${event.is_cancelled ? "bg-red-100 text-red-800" : 
                            event.eventDate < Date.now() ? "bg-gray-100 text-gray-800" : 
                            "bg-green-100 text-green-800"}`}>
                          {event.is_cancelled ? "Cancelled" : 
                            event.eventDate < Date.now() ? "Ended" : "Active"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {event.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No recent events
              </li>
            )}
          </ul>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Link href="/seller/events" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}