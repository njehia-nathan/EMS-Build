// convex/settings.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get a setting by key
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    return setting?.value;
  },
});

// Set a setting value
export const setSetting = mutation({
  args: { 
    key: v.string(),
    value: v.any(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Check if user is a superadmin
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!user || user.role !== "superadmin") {
      throw new Error("Only superadmins can change system settings");
    }
    
    // Check if setting already exists
    const existingSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: args.userId
      });
      return existingSetting._id;
    } else {
      // Create new setting
      return await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: args.userId
      });
    }
  },
});

// Get default commission rate
export const getDefaultCommissionRate = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "defaultCommissionRate"))
      .first();
    
    // Default to 10% if not set
    return setting?.value ?? 10;
  },
});

// Set default commission rate
export const setDefaultCommissionRate = mutation({
  args: { 
    rate: v.number(),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Validate rate is between 0 and 100
    if (args.rate < 0 || args.rate > 100) {
      throw new Error("Commission rate must be between 0 and 100");
    }
    
    return await ctx.db.insert("settings", {
      key: "defaultCommissionRate",
      value: args.rate,
      updatedAt: Date.now(),
      updatedBy: args.userId
    });
  },
});
