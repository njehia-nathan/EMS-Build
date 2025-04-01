// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CreditCard, CheckCircle, AlertCircle, Bug } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { formatCurrency } from "@/lib/utils";

// Debug flag - set to true to enable simulation mode
const SIMULATE_PAYMENT_SUCCESS = true;

interface PaystackPaymentIntegrationProps {
  eventId: Id<"events">;
  eventName: string;
  ticketPrice: number;
  userEmail: string;
  userId: string;
  waitingListId?: Id<"waitingList">;
}

export default function PaystackPaymentIntegration({
  eventId,
  eventName,
  ticketPrice,
  userEmail,
  userId,
  waitingListId,
}: PaystackPaymentIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingFailed, setProcessingFailed] = useState(false);
  const [processingErrorMessage, setProcessingErrorMessage] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  
  // Get the event details
  const event = useQuery(api.events.getById, { eventId });
  
  // Get Convex mutation functions
  const createTicket = useMutation(api.tickets.createTicket);
  const createPayment = useMutation(api.payments.createPayment);
  const removeFromWaitingList = useMutation(api.waitingList.removeFromList);
  
  // Track processing steps for debugging
  const trackStep = (step: string) => {
    setProcessingSteps(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${step}`]);
  };
  
  // Helper function to retry operations with exponential backoff
  const retryOperation = async (operation: () => Promise<any>, operationName: string, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        trackStep(`Attempting ${operationName} (try ${retries + 1}/${maxRetries})`);
        const result = await operation();
        trackStep(`${operationName} succeeded`);
        return result;
      } catch (error) {
        retries++;
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        trackStep(`${operationName} failed (${error.message}), retrying in ${waitTime}ms...`);
        
        if (retries >= maxRetries) {
          trackStep(`${operationName} failed after ${maxRetries} attempts`);
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };
  
  // Define success handler
  const handleSuccess = useCallback(async (reference) => {
    setIsProcessing(true);
    trackStep('Payment success callback triggered');
    console.log("Payment success callback with reference:", reference);
    
    try {
      // Store the original reference for debugging
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
      trackStep('Creating ticket in database');
      
      const ticketResult = await retryOperation(() => createTicket({
        eventId,
        userId,
        waitingListId,
      }), 'Ticket Creation');
      
      console.log("Ticket created:", ticketResult);
      trackStep(`Ticket created with ID: ${ticketResult.ticketId}`);
      
      // 2. Record the payment in our database
      // Ensure we have a string for the reference ID to avoid database type issues
      const normalizedReference = typeof referenceId === 'string' ? referenceId : JSON.stringify(referenceId);
      console.log("Creating payment record with reference:", normalizedReference);
      trackStep('Creating payment record in database');
      
      // Extract authorization details safely
      const authorizationCode = reference?.authorization?.authorization_code || '';
      const cardType = reference?.authorization?.card_type || '';
      const lastFour = reference?.authorization?.last4 || '';
      const paymentMethod = reference?.authorization?.channel || 'card';
      
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
      
      // Log the payment response for debugging
      console.log("Payment response data:", paymentResponseStr);
      
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
        },
        sellerId: event?.userId || userId, // Use event creator as seller
      }), 'Payment Record Creation');
      
      console.log("Payment record created:", paymentResult);
      trackStep('Payment record created successfully');
      
      // 3. If the user was on a waiting list, remove them from it
      if (waitingListId) {
        console.log("Removing user from waiting list:", waitingListId);
        trackStep('Removing user from waiting list');
        
        await retryOperation(() => removeFromWaitingList({
          waitingListId,
          status: "purchased",
        }), 'Waiting List Update');
        
        trackStep('User removed from waiting list');
      }
      
      // 4. Show success message and redirect
      setIsSuccess(true);
      setIsProcessing(false);
      trackStep('Payment processing completed successfully');
      
      toast.success("Payment successful!", {
        description: "Your ticket has been purchased successfully.",
      });
      
      // Redirect to my tickets page after a short delay
      setTimeout(() => {
        trackStep('Redirecting to my-tickets page');
        window.location.href = '/my-tickets';
      }, 2000);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      setProcessingFailed(true);
      setProcessingErrorMessage(error.message || 'Unknown error');
      trackStep(`Payment processing failed: ${error.message || 'Unknown error'}`);
      
      // Get a safe reference string for the error message
      const safeReference = typeof reference === 'string' 
        ? reference 
        : (reference?.reference || reference?.trxref || reference?.transaction || reference?.id || 'unknown');
      
      toast.error("Payment processing error", {
        description: `Your payment was received but we encountered an error processing it. Please contact support with reference: ${safeReference}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [createTicket, createPayment, removeFromWaitingList, eventId, userId, waitingListId, ticketPrice, event?.userId, retryOperation]);
  
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
  }, [isSuccess, isLoading, handleSuccess]);
  
  // Configure Paystack
  const config = {
    reference: `${Date.now()}_${userId.substring(0, 8)}`,
    email: userEmail,
    amount: ticketPrice * 100, // Paystack expects amount in kobo (100 kobo = 1 Naira)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    label: eventName,
    currency: "KES", // Kenyan Shilling
  };
  
  const initializePayment = usePaystackPayment(config);
  
  // Function to simulate successful payment for testing
  const simulatePaymentSuccess = () => {
    setIsLoading(true);
    trackStep('Simulating payment success');
    
    // Create a mock payment response similar to what Paystack would return
    const mockReference = {
      reference: `sim_${Date.now()}_${userId.substring(0, 8)}`,
      trxref: `sim_${Date.now()}_${userId.substring(0, 8)}`,
      status: "success",
      message: "Simulated payment successful",
      transaction: Date.now().toString(),
      authorization: {
        authorization_code: `AUTH_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        card_type: "visa",
        last4: "4242",
        channel: "card"
      }
    };
    
    // Wait a bit to simulate network delay
    setTimeout(() => {
      handleSuccess(mockReference);
    }, 2000);
  };
  
  // Format price for display
  const formatPrice = (price: number) => {
    return formatCurrency(price);
  };
  
  return (
    <div className="space-y-4">
      {/* Payment Card */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Complete Purchase</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Debug Mode</span>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  debugMode ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    debugMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-b border-gray-100">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Event</span>
              <span className="font-medium">{eventName}</span>
            </div>
            <span>{formatPrice(ticketPrice)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium">Pay with Card</span>
            </div>
            
            {/* Payment Buttons */}
            <div className="flex flex-col gap-3">
              {!isSuccess && !isProcessing && !processingFailed && (
                <>
                  {/* Regular Paystack Button */}
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      trackStep('Payment initiated');
                      
                      try {
                        if (SIMULATE_PAYMENT_SUCCESS && debugMode) {
                          simulatePaymentSuccess();
                        } else {
                          // @ts-expect-error - types from react-paystack are not perfect
                          initializePayment(handleSuccess, handleClose);
                        }
                      } catch (error) {
                        console.error("Error initializing payment:", error);
                        toast.error("Payment initialization failed", {
                          description: "Please try again or use a different payment method.",
                        });
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : `Pay ${formatPrice(ticketPrice)}`}
                  </button>
                  
                  {/* Simulate Payment Button (only in debug mode) */}
                  {debugMode && (
                    <button
                      onClick={simulatePaymentSuccess}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Bug className="w-4 h-4" />
                      Simulate Payment Success
                    </button>
                  )}
                </>
              )}
              
              {/* Processing State */}
              {isProcessing && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-600">Processing your payment...</p>
                </div>
              )}
              
              {/* Success State */}
              {isSuccess && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-green-600 font-medium">Payment Successful!</p>
                    <p className="text-sm text-gray-500">
                      Redirecting you to your tickets...
                    </p>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {processingFailed && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-red-600 font-medium">Payment Processing Failed</p>
                    <p className="text-sm text-gray-500">
                      {processingErrorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Panel (only visible in debug mode) */}
      {debugMode && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Panel</h4>
          <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
            {processingSteps.map((step, index) => (
              <div key={index} className="py-1 border-b border-gray-200 last:border-0">
                {step}
              </div>
            ))}
            {processingSteps.length === 0 && (
              <div className="text-gray-500">No processing steps yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
