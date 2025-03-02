import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";



export const getUserTicketForEvent = query({
    args: {
      eventId: v.id("events"),
      userId: v.string(),
    },
    handler: async (ctx, { eventId, userId }) => {
      const ticket = await ctx.db
        .query("tickets")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", userId).eq("eventId", eventId)
        )
        .first();
      return ticket;
    },
  });

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;

    const event = await ctx.db.get(ticket.eventId);
    return { 
      ...ticket,
      event,    
    };
  },
});

export const purchaseTicket = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
  },
  handler: async (ctx, { eventId, userId, waitingListId }) => {
    // Check if user already has a ticket for this event
    const existingTicket = await ctx.db
      .query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    if (existingTicket) {
      throw new ConvexError("You already have a ticket for this event");
    }

    // Verify the waiting list entry exists and is in OFFERED status
    const waitingListEntry = await ctx.db.get(waitingListId);
    if (!waitingListEntry) {
      throw new ConvexError("Waiting list entry not found");
    }

    if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
      throw new ConvexError("This ticket offer has expired");
    }

    if (waitingListEntry.userId !== userId) {
      throw new ConvexError("This ticket offer is not for you");
    }

    // Create the ticket
    const ticketId = await ctx.db.insert("tickets", {
      eventId,
      userId,
      status: TICKET_STATUS.VALID,
      purchasedAt: Date.now(),
    });

    // Update the waiting list entry to purchased
    await ctx.db.patch(waitingListId, {
      status: WAITING_LIST_STATUS.PURCHASED,
    });

    return {
      success: true,
      ticketId,
    };
  },
});