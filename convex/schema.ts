import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    is_cancelled: v.optional(v.boolean()),
    commissionRate: v.optional(v.number()), // Commission rate for this event (percentage)
  }),
  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    purchasedAt: v.number(),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    paymentIntentId: v.optional(v.string()),
    amount: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_payment_intent", ["paymentIntentId"]),

  waitingList: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("purchased"),
      v.literal("expired")
    ),
    offerExpiresAt: v.optional(v.number()),
  })
    .index("by_event_status", ["eventId", "status"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_user", ["userId"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    userId: v.string(),
    stripeConnectId: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("superadmin"),
      v.literal("seller"),
      v.literal("user")
    )),
    paystackRecipientCode: v.optional(v.string()), // For payouts to sellers
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
    
  payments: defineTable({
    userId: v.string(),
    eventId: v.id("events"),
    ticketId: v.id("tickets"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    transactionId: v.string(),
    status: v.string(), // "pending", "completed", "failed", "refunded"
    paymentDetails: v.optional(v.object({
      reference: v.string(),
      gateway: v.string(),
      cardType: v.optional(v.string()),
      lastFour: v.optional(v.string()),
      authorizationCode: v.optional(v.string())
    })),
    refundDetails: v.optional(v.object({
      refundId: v.string(),
      refundedAt: v.number(),
      reason: v.string()
    })),
    createdAt: v.number(),
    sellerId: v.string(), // The seller who created the event
    platformFee: v.optional(v.number()), // The commission amount taken by the platform
    sellerAmount: v.optional(v.number()), // The amount to be paid to the seller
    payoutStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    payoutDetails: v.optional(v.object({
      payoutId: v.string(),
      payoutAt: v.number(),
      reference: v.string()
    })),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_ticket", ["ticketId"])
    .index("by_status", ["status"])
    .index("by_seller", ["sellerId"])
    .index("by_payout_status", ["payoutStatus"]),

  emails: defineTable({
    to: v.string(),
    from: v.string(),
    fromName: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.string(), // "sent", "delivered", "failed"
    sentAt: v.number(),
    deliveredAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index("by_to", ["to"]).index("by_status", ["status"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),
  
  payouts: defineTable({
    sellerId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    paymentIds: v.array(v.id("payments")), // The payments included in this payout
    reference: v.string(),
    paystackTransferId: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"]),
});
