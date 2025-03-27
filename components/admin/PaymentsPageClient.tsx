"use client";

import PaymentsTable from "@/components/admin/PaymentsTable";
import PaymentFilter from "@/components/admin/PaymentFilter";
import PaymentSummary from "@/components/admin/PaymentSummary";

interface PaymentsPageClientProps {
  payments: any[];
  stats: any;
}

export default function PaymentsPageClient({ payments, stats }: PaymentsPageClientProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
      </div>
      
      <PaymentSummary stats={stats} />
      
      <div className="mt-6">
        <PaymentFilter />
      </div>
      
      <div className="mt-4">
        <PaymentsTable payments={payments} />
      </div>
    </div>
  );
}
