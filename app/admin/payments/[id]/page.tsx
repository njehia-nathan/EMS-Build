// app/admin/payments/[id]/page.tsx
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  User, 
  Ticket, 
  CheckCircle, 
  XCircle, 
  Download, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";

async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  try {
    const payment = await convex.query(api.admin.getPaymentById, { 
      paymentId: params.id as Id<"payments"> 
    });
    
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin/payments" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Payments
          </Link>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Payment Details</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-mono">{payment.transactionId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p>{payment.paymentMethod}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p>{new Date(payment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-xl font-semibold">{payment.currency} {payment.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p>{payment.user.name}</p>
                        <p className="text-sm text-gray-500">{payment.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Ticket</p>
                        <Link 
                          href={`/admin/tickets/${payment.ticketId}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {payment.ticketId}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Event Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Event Name</p>
                      <Link
                        href={`/admin/events/${payment.eventId}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {payment.event.name}
                      </Link>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p>{new Date(payment.event.eventDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{payment.event.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h2>
                  
                  <div className="space-y-4">
                    {payment.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <p>Payment completed successfully</p>
                      </div>
                    )}
                    
                    {payment.status === "pending" && (
                      <div className="flex items-center gap-2 text-amber-700">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                        <p>Payment is pending confirmation</p>
                      </div>
                    )}
                    
                    {payment.status === "failed" && (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <p>Payment failed to process</p>
                      </div>
                    )}
                    
                    {payment.status === "refunded" && (
                      <div className="flex items-center gap-2 text-red-700">
                        <RefreshCw className="h-5 w-5" />
                        <p>Payment has been refunded</p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <div className="flex flex-wrap gap-2">
                        {payment.status === "completed" && (
                          <>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </Button>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Process Refund
                            </Button>
                          </>
                        )}
                        
                        {payment.status === "pending" && (
                          <Button className="bg-amber-600 hover:bg-amber-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Manually Confirm Payment
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
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: Could not find payment with ID: {params.id}
        </div>
        <div className="mt-4">
          <Link href="/admin/payments" className="text-blue-600 hover:text-blue-700">
            Back to Payments
          </Link>
        </div>
      </div>
    );
  }
}

export default PaymentDetailPage;