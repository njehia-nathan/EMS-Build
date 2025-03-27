"use client";

import { useState } from "react";
import TicketsTable from "@/components/admin/TicketsTable";
import TicketsFilter from "@/components/admin/TicketsFilter";

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

interface TicketsPageClientProps {
  initialTickets: Ticket[];
}

export default function TicketsPageClient({ initialTickets }: TicketsPageClientProps) {
  const [tickets] = useState(initialTickets);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
      </div>
      
      <TicketsFilter />
      
      <div className="mt-4">
        <TicketsTable tickets={tickets} />
      </div>
    </div>
  );
}
