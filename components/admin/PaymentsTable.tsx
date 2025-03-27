// components/admin/PaymentsTable.tsx
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
import { Eye, Download, RefreshCw } from "lucide-react";

type Payment = {
  _id: string;
  ticketId: string;
  eventId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: string;
  createdAt: number;
  event: {
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
};

export default function PaymentsTable({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<keyof Payment>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const sortedPayments = [...payments].sort((a, b) => {
    if (sortBy === "event" || sortBy === "user") {
      return sortOrder === "asc" 
        ? a[sortBy].name.localeCompare(b[sortBy].name)
        : b[sortBy].name.localeCompare(a[sortBy].name);
    } else if (typeof a[sortBy] === "string" && typeof b[sortBy] === "string") {
      return sortOrder === "asc" 
        ? (a[sortBy] as string).localeCompare(b[sortBy] as string)
        : (b[sortBy] as string).localeCompare(a[sortBy] as string);
    } else {
      return sortOrder === "asc" 
        ? (a[sortBy] as number) - (b[sortBy] as number)
        : (b[sortBy] as number) - (a[sortBy] as number);
    }
  });
  
  const handleSort = (column: keyof Payment) => {
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
                onClick={() => handleSort("transactionId")}
              >
                Transaction ID
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("event")}
              >
                Event
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("user")}
              >
                User
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("paymentMethod")}
              >
                Method
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Date
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
            {sortedPayments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell className="font-mono text-xs">
                  {payment.transactionId}
                </TableCell>
                <TableCell>
                  <button 
                    onClick={() => router.push(`/admin/events/${payment.eventId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {payment.event.name}
                  </button>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{payment.user.name}</p>
                    <p className="text-sm text-gray-500">{payment.user.email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {payment.currency} {payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  {payment.paymentMethod}
                </TableCell>
                <TableCell>
                  {new Date(payment.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : payment.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : payment.status === "failed" || payment.status === "refunded"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/payments/${payment._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={payment.status !== "completed"}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download Receipt</span>
                    </Button>
                    {payment.status === "completed" && (
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
            
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}