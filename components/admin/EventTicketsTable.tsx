// components/admin/EventTicketsTable.tsx
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
  userId: string;
  purchasedAt: number;
  status: string;
  user: {
    name: string;
    email: string;
  };
};

export default function EventTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Tickets ({tickets.length})
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket._id}>
                <TableCell className="font-mono text-xs">{ticket._id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{ticket.user.name}</p>
                    <p className="text-sm text-gray-500">{ticket.user.email}</p>
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
            
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No tickets found for this event
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}