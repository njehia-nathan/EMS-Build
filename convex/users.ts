import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const getUsersStripeConnectId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.neq(q.field("stripeConnectId"), undefined))
      .first();
    return user?.stripeConnectId;
  },
})


export const getUserById = query({
  args: {userId: v.string()},
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    return user;
  },
});

export const getUserRole = query({
  args: {userId: v.string()},
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    return user?.role || "user"; // Default to regular user if no role is set
  },
});

export const isSuperAdmin = query({
  args: {userId: v.string()},
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    return user?.role === "superadmin";
  },
});

export const isSeller = query({
  args: {userId: v.string()},
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    return user?.role === "seller";
  },
});

export const getAllSellers = query({
  handler: async (ctx) => {
    const sellers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "seller"))
      .collect();
      
    return sellers;
  },
});

export const updateUser = mutation({
    args: {
      userId: v.string(),
      name: v.string(),
      email: v.string(),
      role: v.optional(v.union(
        v.literal("superadmin"),
        v.literal("seller"),
        v.literal("user")
      )),
      paystackRecipientCode: v.optional(v.string()),
    },
    handler: async (ctx, { userId, name, email, role, paystackRecipientCode }) => {
      // Check if user exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();
        
      if (existingUser) {
        // Update existing user
        const updates: any = { name, email };
        
        // Only update role if provided
        if (role !== undefined) {
          updates.role = role;
        }
        
        // Only update paystackRecipientCode if provided
        if (paystackRecipientCode !== undefined) {
          updates.paystackRecipientCode = paystackRecipientCode;
        }
        
        await ctx.db.patch(existingUser._id, updates);
        return existingUser._id;
      }
  
      // Create new user
      const newUser: any = {
        userId,
        name,
        email,
        stripeConnectId: undefined,
        role: role || "user", // Default to regular user
      };
      
      if (paystackRecipientCode) {
        newUser.paystackRecipientCode = paystackRecipientCode;
      }
      
      const newUserId = await ctx.db.insert("users", newUser);
  
      return newUserId;
    },
  });
  
export const updateUserRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(
      v.literal("superadmin"),
      v.literal("seller"),
      v.literal("user")
    ),
  },
  handler: async (ctx, { userId, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(user._id, { role });
    return user._id;
  },
});

export const updatePaystackRecipientCode = mutation({
  args: {
    userId: v.string(),
    paystackRecipientCode: v.string(),
  },
  handler: async (ctx, { userId, paystackRecipientCode }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(user._id, { paystackRecipientCode });
    return user._id;
  },
});

// Get seller dashboard data
export const getSellerDashboard = query({
  args: { sellerId: v.string() },
  handler: async (ctx, args) => {
    // Get all events created by this seller
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("userId"), args.sellerId))
      .collect();
      
    // Get all payments for events created by this seller
    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("sellerId"), args.sellerId))
      .collect();
      
    // Calculate dashboard metrics
    const totalEvents = events.length;
    const activeEvents = events.filter(e => !e.is_cancelled && e.eventDate > Date.now()).length;
    const totalRevenue = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    const platformFees = payments
      .filter(p => p.status === "completed" && p.platformFee)
      .reduce((sum, p) => sum + (p.platformFee || 0), 0);
    const netRevenue = totalRevenue - platformFees;
    
    // Get recent payments
    const recentPayments = payments
      .filter(p => p.status === "completed")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
      
    // Get recent events
    const recentEvents = events
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);
      
    return {
      stats: {
        totalEvents,
        activeEvents,
        totalRevenue,
        platformFees,
        netRevenue,
      },
      recentPayments,
      recentEvents,
    };
  },
});