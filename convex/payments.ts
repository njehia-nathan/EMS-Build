// convex/payments.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { paystackService } from "../lib/paystack";

// Create a payment record directly (for Paystack integration)
export const createPayment = mutation({
  args: {
    userId: v.string(),
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    transactionId: v.string(),
    status: v.string(),
    paymentDetails: v.optional(v.object({
      reference: v.string(),
      gateway: v.string(),
      cardType: v.optional(v.string()),
      lastFour: v.optional(v.string()),
      authorizationCode: v.optional(v.string())
    })),
    sellerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Record the payment
    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      eventId: args.eventId,
      ticketId: args.ticketId,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      status: args.status,
      paymentDetails: args.paymentDetails,
      createdAt: Date.now(),
      sellerId: args.sellerId,
      platformFee: 0, // Will be calculated by processPaymentWithCommission
      sellerAmount: 0, // Will be calculated by processPaymentWithCommission
      payoutStatus: "pending"
    });
    
    return paymentId;
  },
});

// Initiate a payment transaction
export const initiatePayment = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
    amount: v.number(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Check if the user is in the waiting list
    const waitingList = await ctx.db.get(args.waitingListId);
    if (!waitingList || waitingList.status !== "offered") {
      throw new Error("Invalid ticket reservation");
    }
    
    // Record the payment intent
    const paymentId = await ctx.db.insert("payments", {
      userId: args.userId,
      eventId: args.eventId,
      ticketId: null as unknown as Id<"tickets">, // Will be updated when completed
      amount: args.amount,
      currency: "KES", // Kenyan Shilling
      paymentMethod: "paystack",
      transactionId: args.reference,
      status: "pending",
      createdAt: Date.now(),
      sellerId: event.userId, // Set the event creator as the seller
      platformFee: 0,
      sellerAmount: 0,
      payoutStatus: "pending"
    });
    
    return { success: true, paymentId };
  },
});

// Complete a payment after successful checkout
export const completePayment = mutation({
  args: {
    reference: v.string(),
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
  },
  handler: async (ctx, args) => {
    try {
      // Find the pending payment
      const payment = await ctx.db
        .query("payments")
        .filter((q) => 
          q.eq(q.field("transactionId"), args.reference) && 
          q.eq(q.field("status"), "pending")
        )
        .first();
      
      if (!payment) {
        return { success: false, message: "Payment not found" };
      }
      
      // Verify payment with Paystack
      const verification = await paystackService.verifyPayment(args.reference);
      
      if (!verification.status || verification.data.status !== "success") {
        // Update payment status to failed
        await ctx.db.patch(payment._id, {
          status: "failed",
        });
        return { success: false, message: "Payment verification failed" };
      }
      
      // Create a ticket
      const ticketId = await ctx.db.insert("tickets", {
        userId: args.userId,
        eventId: args.eventId,
        purchasedAt: Date.now(),
        status: "valid",
      });
      
      // Update payment with ticket ID
      await ctx.db.patch(payment._id, {
        ticketId,
        status: "completed",
        paymentDetails: {
          reference: args.reference,
          gateway: "paystack",
          authorizationCode: verification.data.authorization?.authorization_code,
          lastFour: verification.data.authorization?.last4,
          cardType: verification.data.authorization?.card_type,
        },
      });
      
      // Update waiting list status
      await ctx.db.patch(args.waitingListId, {
        status: "purchased",
      });
      
      return { success: true, ticketId };
    } catch (error) {
      console.error("Payment completion error:", error);
      return { success: false, message: "An error occurred processing the payment" };
    }
  },
});

// Process webhook success event
export const processWebhookSuccess = mutation({
  args: {
    reference: v.string(),
    transactionId: v.string(),
    status: v.string(),
    paymentDetails: v.object({
      gateway: v.string(),
      reference: v.string(),
      authorizationCode: v.optional(v.string()),
      lastFour: v.optional(v.string()),
      cardType: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Find the pending payment
    const payment = await ctx.db
      .query("payments")
      .filter((q) => 
        q.eq(q.field("transactionId"), args.reference) && 
        q.eq(q.field("status"), "pending")
      )
      .first();
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // If we don't have a ticket ID yet, handle ticket creation
    if (!payment.ticketId) {
      // Extract metadata from reference to get waitingListId
      // This is a simplified example - in production, you'd store metadata with the payment
      const waitingList = await ctx.db
        .query("waitingList")
        .filter((q) => q.eq(q.field("userId"), payment.userId))
        .filter((q) => q.eq(q.field("eventId"), payment.eventId))
        .filter((q) => q.eq(q.field("status"), "offered"))
        .first();
      
      if (waitingList) {
        // Create ticket
        const ticketId = await ctx.db.insert("tickets", {
          userId: payment.userId,
          eventId: payment.eventId,
          purchasedAt: Date.now(),
          status: "valid",
        });
        
        // Update payment
        await ctx.db.patch(payment._id, {
          ticketId,
          status: args.status,
          paymentDetails: args.paymentDetails,
        });
        
        // Update waiting list status
        await ctx.db.patch(waitingList._id, {
          status: "purchased",
        });
      }
    } else {
      // Update payment status
      await ctx.db.patch(payment._id, {
        status: args.status,
        paymentDetails: args.paymentDetails,
      });
    }
    
    return { success: true };
  },
});

// Process webhook failure event
export const processWebhookFailure = mutation({
  args: {
    reference: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the pending payment
    const payment = await ctx.db
      .query("payments")
      .filter((q) => 
        q.eq(q.field("transactionId"), args.reference) && 
        q.eq(q.field("status"), "pending")
      )
      .first();
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // Update payment status
    await ctx.db.patch(payment._id, {
      status: args.status,
    });
    
    return { success: true };
  },
});

// Process webhook refund event
export const processWebhookRefund = mutation({
  args: {
    reference: v.string(),
    status: v.string(),
    refundDetails: v.object({
      refundId: v.string(),
      refundedAt: v.number(),
      reason: v.string()
    }),
  },
  handler: async (ctx, args) => {
    // Find the payment
    const payment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("transactionId"), args.reference))
      .first();
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // Update payment status and add refund details
    await ctx.db.patch(payment._id, {
      status: args.status,
      refundDetails: args.refundDetails,
    });
    
    // If there's a ticket, update its status
    if (payment.ticketId) {
      await ctx.db.patch(payment.ticketId, {
        status: "refunded",
      });
    }
    
    return { success: true };
  },
});

// Admin function to manually process a refund
export const processRefund = mutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
    adminId: v.string(), // ID of admin processing the refund
  },
  handler: async (ctx, args) => {
    // Get the payment
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    if (payment.status !== "completed") {
      throw new Error("Cannot refund a payment that is not completed");
    }
    
    // In a real implementation, you would call the Paystack API to process the refund
    // For now, we'll just update our database
    
    // Update payment status
    await ctx.db.patch(args.paymentId, {
      status: "refunded",
      refundDetails: {
        refundId: `manual-${Date.now()}`,
        refundedAt: Date.now(),
        reason: args.reason
      }
    });
    
    // Update ticket status
    if (payment.ticketId) {
      await ctx.db.patch(payment.ticketId, {
        status: "refunded",
      });
    }
    
    return { success: true };
  },
});

// Get payment by ID (for admin dashboard)
export const getPaymentById = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});