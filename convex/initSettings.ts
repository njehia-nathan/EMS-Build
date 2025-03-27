// convex/initSettings.ts
import { mutation } from "./_generated/server";

export const initializeDefaultSettings = mutation({
  handler: async (ctx) => {
    const defaultSettings = [
      { key: "siteName", value: "TicketBaze" },
      { key: "contactEmail", value: "support@ticketbaze.com" },
      { key: "defaultCurrency", value: "KES" },
      { key: "timezone", value: "Africa/Nairobi" },
      { key: "paystackEnabled", value: true },
      { key: "ticketExpiryMinutes", value: 30 },
      { key: "maxTicketsPerUser", value: 5 },
      { key: "adminEmails", value: [] },
      { key: "paymentMethods", value: ["paystack"] },
    ];
    
    for (const setting of defaultSettings) {
      // Check if setting already exists
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();
      
      if (!existing) {
        // Only create if it doesn't exist
        await ctx.db.insert("settings", {
          key: setting.key,
          value: setting.value,
          updatedAt: Date.now(),
        });
        console.log(`Initialized setting: ${setting.key}`);
      }
    }
    
    return { success: true };
  },
});