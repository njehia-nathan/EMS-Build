"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Ticket as TicketIcon, 
  CheckCircle,
  XCircle,
  QrCode,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

type Ticket = {
  _id: string;
  eventId: string;
  userId: string;
  purchasedAt: number;
  status: string;
  user: {
    userId: string;
    name: string;
    email: string;
  };
  event: {
    _id: string;
    name: string;
    eventDate: number;
    location: string;
  };
};

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
} | null;

interface TicketDetailClientProps {
  ticket?: Ticket;
  payment?: Payment;
  error?: string;
}

export default function TicketDetailClient({ ticket, payment, error }: TicketDetailClientProps) {
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
        <div className="mt-4">
          <Link href="/admin/tickets" className="text-blue-600 hover:text-blue-700">
            Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Loading ticket details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/tickets" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tickets
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Ticket Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TicketIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ticket ID</p>
                    <p className="font-mono">{ticket._id}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p>{new Date(ticket.purchasedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Purchased By</p>
                    <Link 
                      href={`/admin/users/${ticket.user.userId}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {ticket.user.name}
                    </Link>
                    <p className="text-sm text-gray-500">{ticket.user.email}</p>
                  </div>
                </div>
                
                {payment && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Payment</p>
                      <Link 
                        href={`/admin/payments/${payment._id}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {payment.currency} {payment.amount.toLocaleString()}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} via {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Event Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Event</p>
                      <Link
                        href={`/admin/events/${ticket.event._id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {ticket.event.name}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p>{new Date(ticket.event.eventDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{ticket.event.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Ticket QR Code</h2>
                  <QrCode className="h-5 w-5 text-gray-500" />
                </div>
                
                <div className="flex justify-center py-6">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode value={ticket._id} size={180} />
                  </div>
                </div>
                
                <p className="text-sm text-center text-gray-500 mt-2">
                  This QR code can be scanned to validate the ticket
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ticket Status</h2>
                
                <div className="space-y-4">
                  {ticket.status === "valid" && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <p>This ticket is valid and unused</p>
                    </div>
                  )}
                  
                  {ticket.status === "used" && (
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-5 w-5" />
                      <p>This ticket has been used</p>
                    </div>
                  )}
                  
                  {ticket.status === "refunded" && (
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <p>This ticket has been refunded</p>
                    </div>
                  )}
                  
                  {ticket.status === "cancelled" && (
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <p>This ticket has been cancelled</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex flex-wrap gap-2">
                      {ticket.status === "valid" && (
                        <>
                          <Button variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Used
                          </Button>
                          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Ticket
                          </Button>
                        </>
                      )}
                      
                      {ticket.status === "used" && (
                        <Button variant="outline">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Revalidate Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
