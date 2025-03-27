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
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),
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
    })
      .index("by_user", ["userId"])
      .index("by_event", ["eventId"])
      .index("by_ticket", ["ticketId"])
      .index("by_status", ["status"]),

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
  });
