"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CreditCard, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { usePaystackPayment } from "react-paystack";

interface PaystackPaymentProps {
  eventId: Id<"events">;
  eventName: string;
  ticketPrice: number;
  userEmail: string;
  userId: string;
  waitingListId: Id<"waitingList">;
}

export default function PaystackPaymentIntegration({
  eventId,
  eventName,
  ticketPrice,
  userEmail,
  userId,
  waitingListId,
}: PaystackPaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Get event creator to set as seller
  const event = useQuery(api.events.getById, { eventId });
  
  // Mutations
  const purchaseTicket = useMutation(api.tickets.purchaseTicket);
  const createPayment = useMutation(api.payments.createPayment);
  const processPaymentWithCommission = useMutation(api.seller.processPaymentWithCommission);
  
  // Generate a unique reference for this transaction
  useEffect(() => {
    const generateReference = () => {
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 10);
      return `tx-${timestamp}-${randomStr}`;
    };
    
    setReference(generateReference());
  }, []);
  
  // Define success handler
  const handleSuccess = async (reference: any) => {
    try {
      setIsLoading(true);
      console.log("Payment successful with reference:", reference);
      
      // Extract the reference ID - Paystack returns different formats in different scenarios
      const referenceId = reference.reference || reference.trxref || reference;
      
      // 1. Purchase the ticket
      const ticketResult = await purchaseTicket({
        eventId,
        userId,
        waitingListId,
      });
      
      if (!ticketResult.success || !ticketResult.ticketId) {
        throw new Error("Failed to create ticket");
      }
      
      // 2. Record the payment in our database
      const paymentResult = await createPayment({
        userId,
        eventId,
        ticketId: ticketResult.ticketId,
        amount: ticketPrice,
        currency: "KES", // Kenyan Shilling
        paymentMethod: paymentMethod === 'mobile_money' ? 'mpesa' : 'card',
        transactionId: typeof referenceId === 'string' ? referenceId : JSON.stringify(referenceId),
        status: "completed",
        paymentDetails: {
          reference: typeof referenceId === 'string' ? referenceId : JSON.stringify(referenceId),
          gateway: "paystack",
          authorizationCode: reference.authorization?.authorization_code || '',
          cardType: reference.authorization?.card_type || '',
          lastFour: reference.authorization?.last4 || '',
        },
        sellerId: event?.userId || userId, // Use event creator as seller
      });
      
      console.log("Payment saved with ID:", paymentResult);
      
      // 3. Process commission for the payment
      if (paymentResult) {
        const commissionResult = await processPaymentWithCommission({
          paymentId: paymentResult,
          commissionRate: event?.commissionRate, // Use event-specific commission if set
        });
        console.log("Commission processed:", commissionResult);
      }
      
      // 4. Show success message and update UI
      setIsSuccess(true);
      toast.success("Payment successful!", {
        description: "Your ticket has been purchased successfully!",
      });
      
      // 5. Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment processing error", {
        description: "Your payment was received but we encountered an error processing it. Please contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Define close handler
  const handleClose = () => {
    setIsLoading(false);
    toast.info("Payment cancelled", {
      description: "You can complete your purchase later.",
    });
  };
  
  // Configure Paystack
  const config = {
    reference,
    email: userEmail,
    amount: ticketPrice * 100, // Convert to cents/kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_a897e797c92ffa5d02310444699d3a0753f788a5",
    currency: "KES", // Kenyan Shilling
    channels: paymentMethod === 'mobile_money' ? ['mobile_money'] : ['card'],
    metadata: {
      custom_fields: [
        {
          display_name: "Event Name",
          variable_name: "event_name",
          value: eventName
        },
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: userId
        },
        {
          display_name: "Event ID",
          variable_name: "event_id",
          value: eventId
        },
        {
          display_name: "Waiting List ID",
          variable_name: "waiting_list_id",
          value: waitingListId
        }
      ]
    }
  };
  
  // For mobile money payments
  if (paymentMethod === 'mobile_money' && phoneNumber) {
    config.metadata.custom_fields.push({
      display_name: "Phone Number",
      variable_name: "phone_number",
      value: phoneNumber
    });
  }
  
  // Initialize Paystack hook
  const initializePayment = usePaystackPayment(config);
  
  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
    }).format(price / 100);
  };
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {isSuccess ? (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your ticket for {eventName} has been confirmed.
          </p>
          <button
            onClick={() => router.push('/my-tickets')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            View My Tickets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Complete Your Purchase
              </h3>
              <p className="text-sm text-gray-500">
                Secure payment via Paystack
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('mobile_money')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                paymentMethod === 'mobile_money'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Phone className="h-8 w-8 mb-2 text-green-600" />
              <span className="text-sm font-medium">M-Pesa</span>
              <span className="text-xs text-gray-500 mt-1">Mobile Money</span>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="h-8 w-8 mb-2 text-blue-600" />
              <span className="text-sm font-medium">Card</span>
              <span className="text-xs text-gray-500 mt-1">Debit/Credit Card</span>
            </button>
          </div>
          
          {paymentMethod === 'mobile_money' && (
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="e.g. 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your phone number in international format (254...)
              </p>
            </div>
          )}
          
          <div className="border-t border-b border-gray-200 py-4 my-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Event</span>
              <span className="font-medium">{eventName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Ticket</span>
              <span className="font-medium">1x Standard Admission</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(ticketPrice)}</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start mb-4">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              Your ticket will be confirmed immediately after successful payment.
              You'll receive a confirmation email with your ticket details.
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsLoading(true);
              if (paymentMethod === 'mobile_money' && !phoneNumber) {
                toast.error('Please enter your phone number');
                setIsLoading(false);
                return;
              }
              // @ts-ignore - types from react-paystack are not perfect
              initializePayment(handleSuccess, handleClose);
            }}
            disabled={isLoading}
            className="w-full bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-md
              hover:bg-green-700 transform hover:scale-[1.02] transition-all duration-200
              disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
          >
            {isLoading ? "Processing..." : `Pay ${formatPrice(ticketPrice)}`}
          </button>
        </div>
      )}
    </div>
  );
}
