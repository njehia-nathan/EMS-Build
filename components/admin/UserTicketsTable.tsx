// components/admin/UserTicketsTable.tsx
"use client";

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
import { Eye, RefreshCw } from "lucide-react";

type Ticket = {
  _id: string;
  eventId: string;
  userId: string;
  purchasedAt: number;
  status: string;
  event?: {
    name: string;
    eventDate: number;
    location: string;
  };
};

export default function UserTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  
  // Sort tickets by date (newest first)
  const sortedTickets = [...tickets].sort((a, b) => b.purchasedAt - a.purchasedAt);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.map((ticket) => (
              <TableRow key={ticket._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{ticket.event?.name || "Unknown Event"}</p>
                    <p className="text-sm text-gray-500">
                      {ticket.event ? new Date(ticket.event.eventDate).toLocaleDateString() : "Unknown Date"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ticket.purchasedAt).toLocaleString()}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Refund</span>
                      </Button>
                    )}
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