// components/admin/EventPaymentsTable.tsx
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
  ticketId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: string;
  createdAt: number;
  user: {
    name: string;
    email: string;
  };
};

export default function EventPaymentsTable({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Payments ({payments.length})
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell className="font-mono text-xs">
                  {payment.transactionId}
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No payments found for this event
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}