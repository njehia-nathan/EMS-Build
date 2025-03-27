// components/admin/EventsTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, AlertTriangle, Check, Ban } from "lucide-react";

type Event = {
  _id: string;
  name: string;
  location: string;
  eventDate: number;
  price: number;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  status: string;
  createdBy: string;
  is_cancelled: boolean;
};

export default function EventsTable({ events }: { events: Event[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<keyof Event>("eventDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === "name" || sortBy === "location" || sortBy === "createdBy") {
      return sortOrder === "asc" 
        ? a[sortBy].localeCompare(b[sortBy])
        : b[sortBy].localeCompare(a[sortBy]);
    } else {
      return sortOrder === "asc" 
        ? (a[sortBy] as number) - (b[sortBy] as number)
        : (b[sortBy] as number) - (a[sortBy] as number);
    }
  });
  
  const handleSort = (column: keyof Event) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Event Name
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("location")}
              >
                Location
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("eventDate")}
              >
                Date
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Price
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("soldTickets")}
              >
                Tickets Sold
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("revenue")}
              >
                Revenue
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.map((event) => (
              <TableRow key={event._id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  {new Date(event.eventDate).toLocaleDateString()}
                </TableCell>
                <TableCell>KSh {event.price.toLocaleString()}</TableCell>
                <TableCell>
                  {event.soldTickets} / {event.totalTickets}
                </TableCell>
                <TableCell>KSh {event.revenue.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.is_cancelled
                      ? "bg-red-100 text-red-800"
                      : event.eventDate < Date.now()
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {event.is_cancelled 
                      ? <>
                          <AlertTriangle className="w-3 h-3 mr-1" /> 
                          Cancelled
                        </>
                      : event.eventDate < Date.now()
                      ? "Ended"
                      : <>
                          <Check className="w-3 h-3 mr-1" /> 
                          Active
                        </>
                    }
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/events/${event._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={event.is_cancelled}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={event.is_cancelled}
                    >
                      <Ban className="h-4 w-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}