// app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

// Helper to verify Paystack signature
const verifyPaystackSignature = (
  requestBody: string,
  signature: string,
  secret: string
): boolean => {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(requestBody)
    .digest("hex");
  return hash === signature;
};

export async function POST(request: NextRequest) {
  try {
    // Get the request body as text
    const requestBodyText = await request.text();
    const requestBody = JSON.parse(requestBodyText);
    
    // Verify webhook signature
    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      return new NextResponse("No signature", { status: 400 });
    }
    
    const isValid = verifyPaystackSignature(
      requestBodyText,
      signature,
      process.env.PAYSTACK_SECRET_KEY!
    );
    
    if (!isValid) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
    
    // Process the webhook event
    const event = requestBody.event;
    const data = requestBody.data;
    
    const convex = getConvexClient();
    
    // Handle different webhook events
    switch (event) {
      case "charge.success":
        // Process successful payment
        await convex.mutation(api.payments.processWebhookSuccess, {
          reference: data.reference,
          transactionId: data.id,
          status: "completed",
          paymentDetails: {
            gateway: "paystack",
            reference: data.reference,
            authorizationCode: data.authorization?.authorization_code,
            lastFour: data.authorization?.last4,
            cardType: data.authorization?.card_type,
          }
        });
        break;
        
      case "charge.failed":
        // Process failed payment
        await convex.mutation(api.payments.processWebhookFailure, {
          reference: data.reference,
          status: "failed",
        });
        break;
        
      case "refund.processed":
        // Process refund
        await convex.mutation(api.payments.processWebhookRefund, {
          reference: data.transaction_reference,
          refundId: data.id,
          status: "refunded",
          refundDetails: {
            refundId: data.id,
            refundedAt: new Date(data.processed_at).getTime(),
            reason: data.merchant_note || "Refund processed"
          }
        });
        break;
        
      default:
        // Unhandled event type
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Error processing webhook", { status: 500 });
  }
}