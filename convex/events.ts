import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constants";
import { internal } from "./_generated/api";

export const get = query({
    args: {},
    handler: async (ctx) => {
      return await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("is_cancelled"), undefined))
        .collect();
    },
  });

  export const getById = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
      return await ctx.db.get(eventId);
    },
  });

  export const getEventAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
      const event = await ctx.db.get(eventId);
      if (!event) throw new Error("Event not found");

      // Count total purchased tickets
    const purchasedCount = await ctx.db
    .query("tickets")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect()
    .then(
      (tickets) =>
        tickets.filter(
          (t) =>
            t.status === TICKET_STATUS.VALID ||
            t.status === TICKET_STATUS.USED
        ).length
    );
    const now = Date.now();
    const activeOffers = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );

      const totalReserved = purchasedCount + activeOffers;

      return {
        isSoldOut: totalReserved >= event.totalTickets,
        totalTickets: event.totalTickets,
        purchasedCount,
        activeOffers,
        remainingTickets: Math.max(0, event.totalTickets - totalReserved),
      };

    },
  });

  //Helper function to check ticket availability for an event
  export const checkAvailability = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
      const event = await ctx.db.get(eventId);
      if (!event) throw new Error("Event not found");

      const purchasedCount = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect()
      .then(
        (tickets) =>
          tickets.filter(
            (t) =>
              t.status === TICKET_STATUS.VALID ||
              t.status === TICKET_STATUS.USED
          ).length
      );

    const now = Date.now();
    const activeOffers = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
      )
      .collect()
      .then(
        (entries) =>
          entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
      );

      const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

      return {
        available: event.totalTickets > (purchasedCount + activeOffers),
        purchasedCount,
        totalTickets: event.totalTickets,
        activeOffers,
      };
    },
  });

  export const joinWaitingList = mutation({
    args: { eventId: v.id("events"), userId: v.string() },
    handler: async (ctx, { eventId, userId }) => {
      const existingEntry = await ctx.db
        .query("waitingList")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", userId).eq("eventId", eventId)
        )
        .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
        .first();

      // dont allow duplicate entries
      if (existingEntry) {
        throw new Error("Already in waiting list");
      }

      // verify the event is still active
      const event = await ctx.db.get(eventId);
      if (!event) {
        throw new Error("Event not found");
      }
      
      //check if there are any available tickets
      const now = Date.now();
      const purchasedCount = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect()
        .then(
          (tickets) =>
            tickets.filter(
              (t) =>
                t.status === TICKET_STATUS.VALID ||
                t.status === TICKET_STATUS.USED
              ).length
        );

      const activeOffers = await ctx.db
        .query("waitingList")
        .withIndex("by_event_status", (q) =>
          q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.OFFERED)
        )
        .collect()
        .then(
          (entries) => entries.filter((e) => (e.offerExpiresAt ?? 0) > now).length
        );

      const available = event.totalTickets > (purchasedCount + activeOffers);

      if (available) {
        // If tickets are available, create an offer entry
        const waitingListId = await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.OFFERED,
          offerExpiresAt: now + DURATIONS.TICKET_OFFER,
        });

        // Schedule a job to expire this offer after the offer duration
        await ctx.scheduler.runAfter(
          DURATIONS.TICKET_OFFER,
          internal.waitingList.expireOffer,
          {
            waitingListId,
            eventId,
          }
        );

        return {
          success: true,
          status: WAITING_LIST_STATUS.OFFERED,
          message: `You have been offered a ticket to the event - you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase it.`
        };
      } else {
        // If no tickets are available, add to waiting list
        await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.WAITING,
        });

        return {
          success: true,
          status: WAITING_LIST_STATUS.WAITING,
          message: "You have been added to the waiting list - you will be notified when tickets become available."
        };
      }
    },
  });