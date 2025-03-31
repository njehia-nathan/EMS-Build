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
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [processingFailed, setProcessingFailed] = useState(false);
  const [processingErrorMessage, setProcessingErrorMessage] = useState('');
  
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
  
  // Function to track steps
  const trackStep = (step: string) => {
    console.log(`PAYMENT TRACKING: ${step}`);
    setProcessingSteps(prev => [...prev, step]);
  };
  
  // Define success handler
  const handleSuccess = async (reference: any) => {
    // Create a retry function for database operations
    const retryOperation = async (operation: () => Promise<any>, operationName: string, maxRetries = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          trackStep(`${operationName} - Attempt ${attempt}`);
          const result = await operation();
          trackStep(`${operationName} - Success`);
          return result;
        } catch (error) {
          console.error(`${operationName} - Attempt ${attempt} failed:`, error);
          trackStep(`${operationName} - Attempt ${attempt} failed: ${error.message || 'Unknown error'}`);
          lastError = error;
          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      trackStep(`${operationName} - All attempts failed`);
      throw lastError;
    };
    
    try {
      setIsLoading(true);
      trackStep('Payment marked as successful by Paystack');
      console.log("Payment successful with reference:", reference);
      
      // Properly handle the reference in different formats
      // Paystack can return different response structures
      const originalReference = reference;
      trackStep('Processing payment reference data');
      
      // Normalize the reference ID - Paystack returns different formats in different scenarios
      let referenceId;
      if (typeof reference === 'string') {
        referenceId = reference;
      } else {
        referenceId = reference.reference || reference.trxref || reference.transaction || reference.id || JSON.stringify(reference);
      }
      
      console.log("Using reference ID:", referenceId);
      trackStep(`Payment reference identified: ${referenceId}`);
      
      // 1. Purchase the ticket
      console.log("Creating ticket with event:", eventId, "user:", userId, "waitingList:", waitingListId);
      trackStep('Initiating ticket purchase in database');
      const ticketResult = await retryOperation(() => purchaseTicket({
        eventId,
        userId,
        waitingListId,
      }), 'Ticket Purchase');
      
      console.log("Ticket purchase result:", ticketResult);
      trackStep(`Ticket created with ID: ${ticketResult.ticketId}`);
      
      if (!ticketResult.success || !ticketResult.ticketId) {
        throw new Error("Failed to create ticket: " + JSON.stringify(ticketResult));
      }
      
      // 2. Record the payment in our database
      // Ensure we have a string for the reference ID to avoid database type issues
      const normalizedReference = typeof referenceId === 'string' ? referenceId : JSON.stringify(referenceId);
      console.log("Creating payment record with reference:", normalizedReference);
      trackStep('Creating payment record in database');
      
      // Extract authorization details safely
      const authorizationCode = reference?.authorization?.authorization_code || '';
      const cardType = reference?.authorization?.card_type || '';
      const lastFour = reference?.authorization?.last4 || '';
      
      // Create a sanitized version of the payment response for storage
      // Remove any circular references that might cause JSON.stringify to fail
      let paymentResponseStr;
      try {
        // First try to stringify the whole response
        paymentResponseStr = JSON.stringify(originalReference);
        trackStep('Payment response data stringified successfully');
      } catch (e) {
        // If that fails, create a simplified version
        console.error("Error stringifying payment response:", e);
        trackStep(`Error stringifying payment response: ${e.message}`);
        paymentResponseStr = JSON.stringify({
          reference: referenceId,
          status: reference?.status || 'success',
          message: reference?.message || 'Payment successful',
          timestamp: Date.now()
        });
        trackStep('Created simplified payment response data');
      }
      
      const paymentResult = await retryOperation(() => createPayment({
        userId,
        eventId,
        ticketId: ticketResult.ticketId,
        amount: ticketPrice,
        currency: "KES", // Kenyan Shilling
        paymentMethod: paymentMethod === 'mobile_money' ? 'mpesa' : 'card',
        transactionId: normalizedReference,
        status: "completed",
        paymentDetails: {
          reference: normalizedReference,
          gateway: "paystack",
          authorizationCode,
          cardType,
          lastFour,
          paymentResponse: paymentResponseStr,
        },
        sellerId: event?.userId || userId, // Use event creator as seller
      }), 'Payment Record Creation');
      
      console.log("Payment saved with ID:", paymentResult);
      trackStep(`Payment record saved with ID: ${paymentResult}`);
      
      if (!paymentResult) {
        throw new Error("Failed to create payment record");
      }
      
      // 3. Process commission for the payment
      try {
        trackStep('Processing commission');
        const commissionResult = await retryOperation(() => processPaymentWithCommission({
          paymentId: paymentResult,
          commissionRate: event?.commissionRate, // Use event-specific commission if set
        }), 'Commission Processing');
        console.log("Commission processed:", commissionResult);
        trackStep('Commission processed successfully');
      } catch (commissionError) {
        // Don't fail the whole transaction if commission processing fails
        console.error("Error processing commission:", commissionError);
        trackStep(`Commission processing error: ${commissionError.message || 'Unknown error'}`);
        toast.error("Commission processing error", {
          description: "Your ticket was purchased but we had trouble calculating the seller commission.",
        });
      }
      
      // 4. Show success message and update UI
      setIsSuccess(true);
      trackStep('Payment process completed successfully');
      toast.success("Payment successful!", {
        description: "Your ticket has been purchased successfully!",
      });
      
      // 5. Refresh the page after a short delay
      trackStep('Scheduling page refresh');
      setTimeout(() => {
        trackStep('Performing page refresh/redirect');
        router.refresh();
        // Force reload if needed for more reliable UI updates
        window.location.href = '/my-tickets';
      }, 2000);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      setProcessingFailed(true);
      setProcessingErrorMessage(error.message || 'Unknown error');
      trackStep(`Payment processing failed: ${error.message || 'Unknown error'}`);
      toast.error("Payment processing error", {
        description: "Your payment was received but we encountered an error processing it. Please contact support with reference: " + reference.reference,
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
  
  // Set up a function to watch for URL changes that might indicate a redirect back from Paystack
  useEffect(() => {
    // Check if there are Paystack parameters in the URL (happens on redirect)
    const checkUrlForPaystackResponse = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const trxref = urlParams.get('trxref');
        const reference = urlParams.get('reference');
        
        // If we have a transaction reference but we're not in success state yet
        if ((trxref || reference) && !isSuccess && !isLoading) {
          console.log("Detected Paystack redirect parameters in URL:", { trxref, reference });
          trackStep('Detected payment redirect parameters in URL');
          
          // Construct response object similar to what direct callback would receive
          const redirectResponse = {
            trxref: trxref,
            reference: reference,
            status: "success", // Assume success since Paystack redirects on success
            message: "Transaction completed via redirect",
            redirectDetected: true
          };
          
          // Handle as success
          handleSuccess(redirectResponse);
        }
      }
    };
    
    // Check immediately on component mount
    checkUrlForPaystackResponse();
    
    // Also set up to check if the URL changes (e.g., browser back/forward navigation)
    window.addEventListener('popstate', checkUrlForPaystackResponse);
    
    return () => {
      window.removeEventListener('popstate', checkUrlForPaystackResponse);
    };
  }, [isSuccess, isLoading]);
  
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
    }).format(price);
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
          
          {/* Debug panel - could be enabled with a query param in production */}
          {processingSteps.length > 0 && (
            <div className="mt-6 w-full text-left p-4 bg-gray-50 rounded-md border border-gray-200 text-xs">
              <h4 className="font-semibold mb-2 text-sm">Payment Processing Steps:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                {processingSteps.map((step, index) => (
                  <li key={index} className="text-gray-700">{step}</li>
                ))}
              </ol>
              {processingFailed && (
                <div className="mt-3 text-red-600">
                  <strong>Error:</strong> {processingErrorMessage}
                </div>
              )}
            </div>
          )}
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
              
              try {
                console.log("Starting payment process with config:", {
                  ...config,
                  publicKey: config.publicKey ? "REDACTED" : "NOT_SET", // Don't log the public key
                  callback_url: window.location.href // Add the current URL as callback
                });
                
                // Set a timeout to reset the loading state if Paystack doesn't respond
                const paymentTimeout = setTimeout(() => {
                  if (isLoading) {
                    console.error("Payment initialization timed out");
                    toast.error("Payment process timed out", {
                      description: "Please try again. If the problem persists, contact support."
                    });
                    setIsLoading(false);
                  }
                }, 30000); // 30 seconds timeout
                
                // Configure appropriate callbacks
                const onSuccess = (response: any) => {
                  clearTimeout(paymentTimeout);
                  console.log("Payment success callback received:", response);
                  trackStep('Paystack success callback received');
                  
                  // Ensure we have a response object with needed data
                  if (!response) {
                    console.error("Empty response from Paystack");
                    trackStep('Empty response from Paystack');
                    response = {
                      reference: reference, // Use our internal reference
                      status: "success", // Assume success
                      message: "Transaction completed but empty response received"
                    };
                  }
                  
                  // Handle the successful payment
                  handleSuccess(response);
                };
                
                const onClose = () => {
                  clearTimeout(paymentTimeout);
                  console.log("Payment modal closed");
                  trackStep('Paystack payment modal closed by user');
                  handleClose();
                };
                
                // @ts-ignore - types from react-paystack are not perfect
                initializePayment(onSuccess, onClose);
              } catch (error) {
                console.error("Error initializing payment:", error);
                toast.error("Payment initialization failed", {
                  description: "Please try again or use a different payment method.",
                });
                setIsLoading(false);
              }
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
