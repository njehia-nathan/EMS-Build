// components/admin/TicketsTable.tsx
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
import { Eye, CheckCircle, XCircle } from "lucide-react";

type Ticket = {
  _id: string;
  eventId: string;
  userId: string;
  purchasedAt: number;
  status: string;
  event: {
    name: string;
    eventDate: number;
  };
  user: {
    name: string;
    email: string;
  };
};

type SortKey = keyof Ticket | "event.name" | "user.name" | "event.eventDate";

export default function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("purchasedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === "event.name") {
      return sortOrder === "asc" 
        ? a.event.name.localeCompare(b.event.name)
        : b.event.name.localeCompare(a.event.name);
    } else if (sortBy === "user.name") {
      return sortOrder === "asc" 
        ? a.user.name.localeCompare(b.user.name)
        : b.user.name.localeCompare(a.user.name);
    } else if (sortBy === "purchasedAt" || sortBy === "event.eventDate") {
      const aValue = sortBy === "purchasedAt" ? a.purchasedAt : a.event.eventDate;
      const bValue = sortBy === "purchasedAt" ? b.purchasedAt : b.event.eventDate;
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      return sortOrder === "asc" 
        ? String(a[sortBy as keyof Ticket]).localeCompare(String(b[sortBy as keyof Ticket]))
        : String(b[sortBy as keyof Ticket]).localeCompare(String(a[sortBy as keyof Ticket]));
    }
  });
  
  const handleSort = (column: SortKey) => {
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
                onClick={() => handleSort("event.name")}
              >
                Event
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("user.name")}
              >
                User
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("purchasedAt")}
              >
                Purchase Date
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("event.eventDate")}
              >
                Event Date
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.map((ticket) => (
              <TableRow key={ticket._id}>
                <TableCell>
                  <button 
                    onClick={() => router.push(`/admin/events/${ticket.eventId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    {ticket.event.name}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <button 
                        onClick={() => router.push(`/admin/users/${ticket.userId}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {ticket.user.name}
                      </button>
                      <p className="text-sm text-gray-500">{ticket.user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ticket.purchasedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(ticket.event.eventDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ticket.status === "valid"
                      ? "bg-green-100 text-green-800"
                      : ticket.status === "used"
                      ? "bg-blue-100 text-blue-800"
                      : ticket.status === "refunded" || ticket.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/tickets/${ticket._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    {ticket.status === "valid" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Mark Used</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No tickets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}