import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { WAITING_LIST_STATUS } from "./constants";
import { checkAvailability } from "./events";
import { internal } from "./_generated/api";

// Helper function to process the queue and offer tickets to the next person in line
async function processQueue(
    ctx: any,
    { eventId }: { eventId: any }
) {
    // Check if there are any available tickets
    const available = await checkAvailability(ctx, { eventId });
    if (!available) return;

    // Find the next person in the waiting list
    const nextInLine = await ctx.db
        .query("waitingList")
        .withIndex("by_event_status", (q: { eq: (arg0: string, arg1: any) => { (): any; new(): any; eq: { (arg0: string, arg1: string): any; new(): any; }; }; }) =>
            q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.WAITING)
        )
        .order("asc")
        .first();

    if (!nextInLine) return;

    // Offer the ticket to the next person
    const offerExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    await ctx.db.patch(nextInLine._id, {
        status: WAITING_LIST_STATUS.OFFERED,
        offerExpiresAt,
    });

    // Schedule a job to expire this offer
    await ctx.scheduler.runAfter(30 * 60 * 1000, internal.waitingList.expireOffer, {
        waitingListId: nextInLine._id,
        eventId,
    });
}

export const getQueuePosition = query({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
    },
    handler: async (ctx, { eventId, userId }) => {
        // Get entry for this specific user and event combination
        const entry = await ctx.db
            .query("waitingList")
            .withIndex("by_user_event", (q) =>
            q.eq("userId", userId).eq("eventId", eventId)
            )
            .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
            .first();
        
            if (!entry) return null;
        
        // Get total number of people ahead in line
        const peopleAhead = await ctx.db
            .query("waitingList")
            .withIndex("by_event_status", (q) => q.eq("eventId", eventId))
            .filter((q) =>
            q.and(
                q.lt(q.field("_creationTime"), entry._creationTime),
                q.or(
                    q.eq(q.field("status"), WAITING_LIST_STATUS.WAITING),
                    q.eq(q.field("status"), WAITING_LIST_STATUS.OFFERED)
                )
            )
            )
            .collect()
            .then((entries) => entries.length);
            
            return {
                ...entry,
                position: peopleAhead + 1,
            };
    },
});

/**
 * Internal mutation to expire a single offer and process queue for next person.
 * Called by scheduled job when offer timer expires.
 */
export const expireOffer = internalMutation({
    args: {
        waitingListId: v.id("waitingList"),
        eventId: v.id("events"),
    },
    handler: async (ctx, { waitingListId, eventId }) => {
        const offer = await ctx.db.get(waitingListId);
        // If offer is not found or is not is OFFERED status, do nothing
        if (!offer || offer.status !== WAITING_LIST_STATUS.OFFERED) return;

        await ctx.db.patch(waitingListId, {
            status: WAITING_LIST_STATUS.EXPIRED,
        });

        await processQueue(ctx, { eventId });


    }
})

export const releaseTicket = mutation({
    args: {
      eventId: v.id("events"),
      waitingListId: v.id("waitingList"),
    },
    handler: async (ctx, { eventId, waitingListId }) => {
        const entry = await ctx.db.get(waitingListId);

    if (!entry || entry.status !== WAITING_LIST_STATUS.OFFERED) {
      throw new Error("No valid ticket offer found");
    }

    // Mark the entry as expired
    await ctx.db.patch(waitingListId, {
      status: WAITING_LIST_STATUS.EXPIRED,
    });
    
    // Process queue to offer ticket to next person
    await processQueue(ctx, { eventId });
    }
});