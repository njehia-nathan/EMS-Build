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

      //Count current valid offers
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

      const availableSpots = event.totalTickets - (purchasedCount + activeOffers);

      return {
        available: availableSpots > 0,
        availableSpots,
        totalTickets: event.totalTickets,
        purchasedCount,
        activeOffers,
      }
    }
  })

  // Join waiting list for an event
  export const joinWaitingList = mutation({
    // Function takes an event ID and user ID as arguments
    args: { eventId: v.id("events"), userId: v.string() },
    handler: async (ctx, { eventId, userId }) => {
    // Rate Limit check
    //const status = await rateLimiter.limit(ctx, "queueJoin", { key: userId});
    //if (!status.ok) {
      //throw new ConvexError(
        //`You've joined the waiting list too many times. Please wait ${Math.ceil(
  //        status.retryAfter / (60 * 1000)
    //    )} minutes before trying again.`
      //)
     //}

     // First check if user already has an active entry in waiting list for this event
     // Active means any status except Expired
     const exisitingEntry = await ctx.db
     .query("waitingList")
     .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
     )
     .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
     .first();

     // Don't allow duplicate entries
     if (exisitingEntry) {
       throw new ConvexError(
         "You already have an active entry in the waiting list for this event."
       );
     }

     // Verify the event exists
     const event = await ctx.db.get(eventId);
     if (!event) throw new ConvexError("Event not found");
     
      //Check if there are any available tickets
      const { available } = await checkAvailability(ctx, { eventId });

      const now = Date.now();

      if (!available) {
        // If tickets are available, create an offer entry
        const waitingListId = await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.OFFERED,
          offerExpiresAt: now + DURATIONS.TICKET_OFFER,
        });

        //Schedule a job to expire this offer after the offer duration
        await ctx.scheduler.runAfter(
          DURATIONS.TICKET_OFFER,
          internal.waitingList.expireOffer,
          {
            waitingListId,
            eventId,
          }
        );
      } else{
        // If no tickets are available, add to waiting list
        await ctx.db.insert("waitingList", {
          eventId,
          userId,
          status: WAITING_LIST_STATUS.WAITING,// Mark as waiting
        })
      }

      return{
        success: true,
        status: available
          ? WAITING_LIST_STATUS.OFFERED // iF Available, status is offered
          : WAITING_LIST_STATUS.WAITING, // Otherwise, status is waiting
        message: available
          ? `You have been offered a ticket to the event - you have ${DURATIONS.TICKET_OFFER / (60 * 1000)} minutes to purchase it.`
          : "You have been added to the waiting list - you will be notified when tickets become available.",
      }
     
    },
  });