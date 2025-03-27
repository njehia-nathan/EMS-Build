// components/admin/UserPurchasesTable.tsx
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
import { Eye, Download } from "lucide-react";

type Payment = {
  _id: string;
  eventId: string;
  ticketId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: string;
  createdAt: number;
  event?: {
    name: string;
  };
};

export default function UserPurchasesTable({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  
  // Sort payments by date (newest first)
  const sortedPayments = [...payments].sort((a, b) => b.createdAt - a.createdAt);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  <p className="font-medium">{payment.event?.name || "Unknown Event"}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{payment.transactionId.substring(0, 12)}</p>
                </TableCell>
                <TableCell className="font-medium">
                  {payment.currency} {payment.amount.toLocaleString()}
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
                    {payment.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Receipt</span>
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