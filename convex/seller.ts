// @ts-nocheck

// convex/seller.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all events created by a seller
export const getSellerEvents = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("userId"), args.sellerId))
      .collect();
    
    // Get ticket counts and revenue for each event
    return Promise.all(events.map(async (event) => {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      
      const soldTickets = tickets.filter(t => t.status === "valid" || t.status === "used").length;
      const revenue = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        ...event,
        soldTickets,
        revenue,
        status: event.is_cancelled 
          ? "cancelled" 
          : event.eventDate < Date.now() 
          ? "ended" 
          : "active",
      };
    }));
  }
});

// Get event details by ID (for seller)
export const getSellerEventById = query({
  args: { eventId: v.id("events"), sellerId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Verify the seller owns this event
    if (event.userId !== args.sellerId) {
      throw new Error("Unauthorized access to event");
    }
    
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    // Calculate metrics
    const soldTickets = tickets.filter(t => t.status === "valid" || t.status === "used").length;
    const refundedTickets = tickets.filter(t => t.status === "refunded").length;
    const revenue = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    const platformFees = payments
      .filter(p => p.status === "completed" && p.platformFee)
      .reduce((sum, p) => sum + (p.platformFee || 0), 0);
    const netRevenue = revenue - platformFees;
    
    return {
      ...event,
      metrics: {
        soldTickets,
        refundedTickets,
        revenue,
        platformFees,
        netRevenue
      }
    };
  }
});

// Get all payments for a seller's events
export const getSellerPayments = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    // Get all payments where sellerId matches
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();
    
    // Enrich payment data with event and user information
    return Promise.all(payments.map(async (payment) => {
      const event = await ctx.db.get(payment.eventId);
      const user = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", payment.userId))
        .first();
      
      return {
        ...payment,
        eventName: event?.name || "Unknown Event",
        userName: user?.name || "Unknown User",
        userEmail: user?.email || "unknown@example.com"
      };
    }));
  }
});

// Get payouts for a seller
export const getSellerPayouts = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();
    
    return payouts;
  }
});

// Update event commission rate
export const updateEventCommissionRate = mutation({
  args: { 
    eventId: v.id("events"),
    sellerId: v.string(),
    commissionRate: v.number()
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Verify the seller owns this event
    if (event.userId !== args.sellerId) {
      throw new Error("Unauthorized access to event");
    }
    
    // Update commission rate
    await ctx.db.patch(args.eventId, {
      commissionRate: args.commissionRate
    });
    
    return args.eventId;
  }
});

// Process payment with commission
export const processPaymentWithCommission = mutation({
  args: {
    paymentId: v.id("payments"),
    commissionRate: v.number(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    // Only process completed payments
    if (payment.status !== "completed") {
      return payment._id;
    }
    
    // Get event to check for commission rate
    const event = await ctx.db.get(payment.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    // Determine commission rate (use provided rate, event rate, or default 10%)
    const rate = args.commissionRate ?? event.commissionRate ?? 10;
    
    // Calculate platform fee and seller amount
    const platformFee = Math.round((payment.amount * rate) / 100);
    const sellerAmount = payment.amount - platformFee;
    
    // Update payment with commission details
    await ctx.db.patch(payment._id, {
      platformFee,
      sellerAmount,
      payoutStatus: "pending"
    });
    
    return payment._id;
  }
});

// Get pending payouts for a seller
export const getPendingPayouts = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    // Get all completed payments for this seller that haven't been paid out
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .filter((q) => 
        q.eq(q.field("status"), "completed") && 
        q.eq(q.field("payoutStatus"), "pending")
      )
      .collect();
    
    // Group payments by event for reporting
    const eventPayments = {};
    for (const payment of payments) {
      if (!eventPayments[payment.eventId]) {
        eventPayments[payment.eventId] = [];
      }
      eventPayments[payment.eventId].push(payment);
    }
    
    // Format as pending payouts
    const pendingPayouts = [];
    for (const [eventId, eventPaymentList] of Object.entries(eventPayments)) {
      // Get the event details
      const event = await ctx.db.get(eventId as Id<"events">);
      
      // Calculate total amount for this event's pending payouts
      const totalAmount = eventPaymentList.reduce((sum, p) => {
        // Use sellerAmount if available, otherwise calculate it
        const sellerAmount = p.sellerAmount || (p.amount - (p.platformFee || 0));
        return sum + sellerAmount;
      }, 0);
      
      // Create a pending payout record
      pendingPayouts.push({
        _id: `pending_${eventId}`, // Not a real DB ID, just for client-side tracking
        sellerId: args.sellerId,
        eventId: eventId,
        eventName: event?.name || "Unknown Event",
        amount: totalAmount,
        currency: "KES",
        status: "pending",
        reference: `payout_${eventId}_${Date.now()}`,
        createdAt: Date.now(),
        paymentCount: eventPaymentList.length
      });
    }
    
    return pendingPayouts;
  }
});
