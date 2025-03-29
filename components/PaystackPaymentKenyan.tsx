'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { usePaystackPayment } from 'react-paystack';
import { toast } from 'sonner';
import { CreditCard, Phone, Loader2 } from 'lucide-react';

interface PaystackPaymentProps {
  eventId: Id<"events">;
  eventName: string;
  ticketPrice: number;
  userEmail: string;
  userId: string;
  waitingListId: Id<"waitingList">;
}

export default function PaystackPaymentKenyan({
  eventId,
  eventName,
  ticketPrice,
  userEmail,
  userId,
  waitingListId
}: PaystackPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const createPayment = useMutation(api.payments.createPayment);
  const completePayment = useMutation(api.payments.completePayment);
  const createTicket = useMutation(api.tickets.createTicket);
  
  // Format the reference with a timestamp to ensure uniqueness
  const reference = `${userId.substring(0, 8)}-${Date.now()}`;
  
  // Configure Paystack payment
  const config = {
    reference,
    email: userEmail,
    amount: ticketPrice * 100, // Paystack amount is in kobo (cents)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'KES', // Kenyan Shilling
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
  
  const initializePayment = usePaystackPayment(config);
  
  // Handle successful payment
  const onSuccess = async (transaction: any) => {
    try {
      setIsProcessing(true);
      
      // Create payment record in database
      const paymentId = await createPayment({
        userId,
        eventId,
        amount: ticketPrice,
        currency: 'KES',
        paymentMethod: paymentMethod === 'mobile_money' ? 'mpesa' : 'card',
        transactionId: transaction.reference,
        status: 'pending',
      });
      
      // Verify payment with Paystack
      const verificationResult = await completePayment({
        reference: transaction.reference,
        paymentId
      });
      
      if (verificationResult.success) {
        // Create ticket
        await createTicket({
          eventId,
          userId,
          waitingListId,
          paymentId
        });
        
        toast.success('Payment successful! Your ticket has been confirmed.');
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('An error occurred while processing your payment.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle payment cancellation
  const onClose = () => {
    toast.error('Payment was cancelled.');
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Payment Method
        </h3>
        
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
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Ticket Price:</span>
            <span className="font-medium">KSh {ticketPrice.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold">KSh {ticketPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            if (paymentMethod === 'mobile_money' && !phoneNumber) {
              toast.error('Please enter your phone number');
              return;
            }
            initializePayment(onSuccess as any, onClose);
          }}
          disabled={isProcessing}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Processing...
            </>
          ) : (
            <>Pay Now</>
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        <p>Secured by Paystack. Your payment information is secure.</p>
        <p className="mt-1">By proceeding, you agree to our terms and conditions.</p>
      </div>
    </div>
  );
}
