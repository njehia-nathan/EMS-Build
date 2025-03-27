// components/admin/EventsPerformance.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Ticket, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Event = {
  _id: string;
  name: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
  salesVelocity: number;
};

type EventsPerformanceProps = {
  events: Event[];
};

export default function EventsPerformance({ events }: EventsPerformanceProps) {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      {events.map((event) => (
        <div 
          key={event._id}
          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
          onClick={() => router.push(`/admin/events/${event._id}`)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">{event.name}</h3>
            <div className="flex items-center gap-1 text-blue-600 text-sm">
              View Details <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-gray-600">Tickets Sold: {event.ticketsSold}/{event.totalTickets}</span>
              <span className="font-medium">{Math.round((event.ticketsSold / event.totalTickets) * 100)}%</span>
            </div>
            <Progress value={(event.ticketsSold / event.totalTickets) * 100} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Ticket className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sales Velocity</p>
                <p className="font-medium">{event.salesVelocity.toFixed(1)} tickets/day</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="font-medium">KSh {event.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No event data available for the selected period
        </div>
      )}
    </div>
  );
}