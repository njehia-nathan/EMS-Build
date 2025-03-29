// convex/admin.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Dashboard stats
export const getDashboardStats = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const users = await ctx.db.query("users").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const payments = await ctx.db.query("payments").collect();
    
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    return {
      totalEvents: events.length,
      totalUsers: users.length,
      totalTicketsSold: tickets.filter(t => t.status === "valid" || t.status === "used").length,
      totalRevenue: payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
      activeEvents: events.filter(e => !e.is_cancelled && e.eventDate > now).length,
      newUsersToday: users.filter(u => u._creationTime > todayStart.getTime()).length,
      ticketsSoldToday: tickets.filter(t => t.purchasedAt > todayStart.getTime()).length,
      revenueToday: payments
        .filter(p => p.status === "completed" && p.createdAt > todayStart.getTime())
        .reduce((sum, p) => sum + p.amount, 0)
    };
  },
});

// Get recent events (for dashboard)
export const getRecentEvents = query({
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .order("desc")
      .take(5);
    
    return events.map(event => ({
      _id: event._id,
      name: event.name,
      date: event.eventDate,
      status: event.is_cancelled ? "cancelled" : event.eventDate < Date.now() ? "ended" : "active"
    }));
  }
});

// Get recent payments (for dashboard)
export const getRecentPayments = query({
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .order("desc")
      .take(5);
    
    return payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      date: payment.createdAt,
      status: payment.status
    }));
  }
});

// Get all events with metrics
export const getAllEvents = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const tickets = await ctx.db.query("tickets").collect();
    const payments = await ctx.db.query("payments").collect();
    
    return Promise.all(events.map(async (event) => {
      const eventTickets = tickets.filter(t => t.eventId === event._id);
      const soldTickets = eventTickets.filter(t => t.status === "valid" || t.status === "used").length;
      const revenue = payments
        .filter(p => p.eventId === event._id && p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        _id: event._id,
        name: event.name,
        location: event.location,
        eventDate: event.eventDate,
        price: event.price,
        totalTickets: event.totalTickets,
        soldTickets,
        revenue,
        status: event.is_cancelled 
          ? "cancelled" 
          : event.eventDate < Date.now() 
          ? "ended" 
          : "active",
        createdBy: event.userId,
        is_cancelled: event.is_cancelled
      };
    }));
  }
});

// Get event details by ID
export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const tickets = await ctx.db
      .query("tickets")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .collect();
    
    const payments = await ctx.db
      .query("payments")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .collect();
    
    const waitingList = await ctx.db
      .query("waitingList")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .collect();
    
    // Calculate metrics
    const soldTickets = tickets.filter(t => t.status === "valid" || t.status === "used").length;
    const refundedTickets = tickets.filter(t => t.status === "refunded").length;
    const revenue = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    const activeQueue = waitingList.filter(w => w.status === "waiting").length;
    
    return {
      ...event,
      metrics: {
        soldTickets,
        refundedTickets,
        revenue,
        activeQueue
      }
    };
  }
});

// Get tickets for an event
export const getEventTickets = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .collect();
    
    return Promise.all(tickets.map(async (ticket) => {
      const user = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("userId"), ticket.userId))
        .first();
      
      return {
        ...ticket,
        user: {
          name: user?.name || "Unknown User",
          email: user?.email || "unknown@example.com"
        }
      };
    }));
  }
});

// Get payments for an event
export const getEventPayments = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .filter(q => q.eq(q.field("eventId"), args.eventId))
      .collect();
    
    return Promise.all(payments.map(async (payment) => {
      const user = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("userId"), payment.userId))
        .first();
      
      return {
        ...payment,
        user: {
          name: user?.name || "Unknown User",
          email: user?.email || "unknown@example.com"
        }
      };
    }));
  }
});

// Get all payments
export const getAllPayments = query({
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    
    return Promise.all(payments.map(async (payment) => {
      const user = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("userId"), payment.userId))
        .first();
      
      const event = await ctx.db.get(payment.eventId);
      
      return {
        ...payment,
        user: {
          name: user?.name || "Unknown User",
          email: user?.email || "unknown@example.com"
        },
        event: {
          name: event?.name || "Unknown Event"
        }
      };
    }));
  }
});

// Get payment statistics
export const getPaymentStats = query({
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    
    const completed = payments.filter(p => p.status === "completed");
    const pending = payments.filter(p => p.status === "pending");
    const refunded = payments.filter(p => p.status === "refunded");
    const failed = payments.filter(p => p.status === "failed");
    
    const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
    
    // Group by payment method
    const methodGroups = completed.reduce((acc, payment) => {
      const method = payment.paymentMethod;
      if (!acc[method]) {
        acc[method] = { amount: 0, count: 0 };
      }
      acc[method].amount += payment.amount;
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { amount: number, count: number }>);
    
    const revenueByMethod = Object.entries(methodGroups).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count
    }));
    
    return {
      totalRevenue,
      totalPayments: payments.length,
      completedPayments: completed.length,
      pendingPayments: pending.length,
      refundedPayments: refunded.length,
      failedPayments: failed.length,
      averageOrderValue: completed.length ? totalRevenue / completed.length : 0,
      revenueByMethod
    };
  }
});

// Get payment by ID
export const getPaymentById = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("userId"), payment.userId))
      .first();
    
    const event = await ctx.db.get(payment.eventId);
    
    return {
      ...payment,
      user: {
        name: user?.name || "Unknown User",
        email: user?.email || "unknown@example.com"
      },
      event: {
        name: event?.name || "Unknown Event",
        eventDate: event?.eventDate,
        location: event?.location
      }
    };
  }
});

export const getAllUsers = query({
    handler: async (ctx) => {
      const users = await ctx.db.query("users").collect();
      
      return Promise.all(users.map(async (user) => {
        const tickets = await ctx.db
          .query("tickets")
          .filter(q => q.eq(q.field("userId"), user.userId))
          .collect();
        
        const payments = await ctx.db
          .query("payments")
          .filter(q => q.eq(q.field("userId"), user.userId))
          .collect();
        
        const events = await ctx.db
          .query("events")
          .filter(q => q.eq(q.field("userId"), user.userId))
          .collect();
        
        const totalSpent = payments
          .filter(p => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0);
          
        return {
          ...user,
          ticketsCount: tickets.length,
          paymentsCount: payments.length,
          eventsCreated: events.length,
          totalSpent,
          joinedAt: user._creationTime,
          lastActive: user._creationTime,
        };
      }));
    }
  });
  
  // Get user by ID
  export const getUserById = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
      const user = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (!user) {
        throw new Error("User not found");
      }
      
      const tickets = await ctx.db
        .query("tickets")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();
      
      const payments = await ctx.db
        .query("payments")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();
      
      const events = await ctx.db
        .query("events")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();
      
      return {
        ...user,
        tickets,
        payments,
        events,
        stats: {
          ticketsCount: tickets.length,
          paymentsCount: payments.length,
          eventsCreated: events.length,
          totalSpent: payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0),
        }
      };
    }
  });


// Get all tickets
export const getAllTickets = query({
    handler: async (ctx) => {
      const tickets = await ctx.db.query("tickets").collect();
      
      return Promise.all(tickets.map(async (ticket) => {
        const user = await ctx.db
          .query("users")
          .filter(q => q.eq(q.field("userId"), ticket.userId))
          .first();
        
        const event = await ctx.db.get(ticket.eventId);
        
        return {
          ...ticket,
          user: {
            name: user?.name || "Unknown User",
            email: user?.email || "unknown@example.com",
          },
          event: {
            name: event?.name || "Unknown Event",
            eventDate: event?.eventDate || 0,
          },
        };
      }));
    },
  });
  
  // Get ticket by ID
  export const getTicketById = query({
    args: { ticketId: v.id("tickets") },
    handler: async (ctx, args) => {
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      
      const user = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("userId"), ticket.userId))
        .first();
      
      const event = await ctx.db.get(ticket.eventId);
      
      return {
        ...ticket,
        user: {
          userId: ticket.userId,
          name: user?.name || "Unknown User",
          email: user?.email || "unknown@example.com",
        },
        event: {
          _id: event?._id || ticket.eventId,
          name: event?.name || "Unknown Event",
          eventDate: event?.eventDate || 0,
          location: event?.location || "Unknown Location",
        },
      };
    },
  });
  
  // Get payment for a ticket
  export const getTicketPayment = query({
    args: { ticketId: v.id("tickets") },
    handler: async (ctx, args) => {
      const payment = await ctx.db
        .query("payments")
        .filter(q => q.eq(q.field("ticketId"), args.ticketId))
        .first();
      
      return payment;
    },
  });
  
  // Update ticket status
  export const updateTicketStatus = mutation({
    args: { 
      ticketId: v.id("tickets"),
      status: v.union(
        v.literal("valid"),
        v.literal("used"),
        v.literal("refunded"),
        v.literal("cancelled")
      )
    },
    handler: async (ctx, args) => {
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      
      await ctx.db.patch(args.ticketId, {
        status: args.status,
      });
      
      return { success: true };
    },
  });


// Get sales analytics data
export const getSalesAnalytics = query({
    handler: async (ctx) => {
      const payments = await ctx.db.query("payments").collect();
      const tickets = await ctx.db.query("tickets").collect();
      const events = await ctx.db.query("events").collect();
      
      // Get current date for calculations
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Revenue by period (last 12 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const labels = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const year = currentMonth - monthIndex < 0 ? currentYear - 1 : currentYear;
        return `${months[monthIndex]} ${year}`;
      });
      
      // Calculate revenue for each month
      const revenueByMonth = Array(12).fill(0);
      const ticketsByMonth = Array(12).fill(0);
      
      // Process completed payments
      payments
        .filter(payment => payment.status === "completed")
        .forEach(payment => {
          const date = new Date(payment.createdAt);
          const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
          
          if (monthsAgo < 12) {
            const index = 11 - monthsAgo;
            revenueByMonth[index] += payment.amount;
          }
        });
      
      // Process tickets
      tickets.forEach(ticket => {
        const date = new Date(ticket.purchasedAt);
        const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
        
        if (monthsAgo < 12) {
          const index = 11 - monthsAgo;
          ticketsByMonth[index]++;
        }
      });
      
      // Revenue by payment method
      const paymentMethods = new Map();
      payments
        .filter(payment => payment.status === "completed")
        .forEach(payment => {
          const method = payment.paymentMethod || "Other";
          const currentAmount = paymentMethods.get(method) || 0;
          paymentMethods.set(method, currentAmount + payment.amount);
        });
      
      const revenueByMethod = {
        labels: Array.from(paymentMethods.keys()),
        values: Array.from(paymentMethods.values()),
      };
      
      // Sales by time of day
      const timeOfDayMap = new Map([
        ["Morning (6am-12pm)", 0],
        ["Afternoon (12pm-5pm)", 0],
        ["Evening (5pm-10pm)", 0],
        ["Night (10pm-6am)", 0],
      ]);
      
      tickets.forEach(ticket => {
        const date = new Date(ticket.purchasedAt);
        const hour = date.getHours();
        
        if (hour >= 6 && hour < 12) {
          timeOfDayMap.set("Morning (6am-12pm)", timeOfDayMap.get("Morning (6am-12pm)") + 1);
        } else if (hour >= 12 && hour < 17) {
          timeOfDayMap.set("Afternoon (12pm-5pm)", timeOfDayMap.get("Afternoon (12pm-5pm)") + 1);
        } else if (hour >= 17 && hour < 22) {
          timeOfDayMap.set("Evening (5pm-10pm)", timeOfDayMap.get("Evening (5pm-10pm)") + 1);
        } else {
          timeOfDayMap.set("Night (10pm-6am)", timeOfDayMap.get("Night (10pm-6am)") + 1);
        }
      });
      
      const salesByTimeOfDay = {
        labels: Array.from(timeOfDayMap.keys()),
        values: Array.from(timeOfDayMap.values()),
      };
      
      // Platform growth metrics
      const eventsByMonth = Array(12).fill(0);
      events.forEach(event => {
        const date = new Date(event._creationTime);
        const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
        
        if (monthsAgo < 12) {
          const index = 11 - monthsAgo;
          eventsByMonth[index]++;
        }
      });
      
      // Get users data for platform growth
      const users = await ctx.db.query("users").collect();
      const usersByMonth = Array(12).fill(0);
      
      users.forEach(user => {
        const date = new Date(user._creationTime);
        const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
        
        if (monthsAgo < 12) {
          const index = 11 - monthsAgo;
          usersByMonth[index]++;
        }
      });
      
      // Calculate conversion metrics
      // For this, we would need waitingList data to track progression
      const waitingListEntries = await ctx.db.query("waitingList").collect();
      
      // Calculate total tickets offered
      const totalTicketsOffered = waitingListEntries.filter(entry => 
        entry.status === "offered" || entry.status === "purchased"
      ).length;
      
      // Calculate total tickets purchased
      const totalTicketsPurchased = waitingListEntries.filter(entry => 
        entry.status === "purchased"
      ).length;
      
      // Abandoned tickets are those that were offered but not purchased
      const totalTicketsAbandoned = totalTicketsOffered - totalTicketsPurchased;
      
      // Calculate conversion rate
      const conversionRate = totalTicketsOffered > 0 
        ? (totalTicketsPurchased / totalTicketsOffered) * 100 
        : 0;
      
      const abandonmentRate = totalTicketsOffered > 0 
        ? (totalTicketsAbandoned / totalTicketsOffered) * 100 
        : 0;
      
      const conversionMetrics = {
        labels: ["Conversion Rate", "Abandonment Rate"],
        values: [conversionRate, abandonmentRate],
      };
      
      // Refund metrics
      const totalTickets = tickets.length;
      const refundedTickets = tickets.filter(ticket => ticket.status === "refunded").length;
      const cancelledTickets = tickets.filter(ticket => ticket.status === "cancelled").length;
      const validTickets = tickets.filter(ticket => ticket.status === "valid" || ticket.status === "used").length;
      
      const refundRate = totalTickets > 0 ? (refundedTickets / totalTickets) * 100 : 0;
      const cancelRate = totalTickets > 0 ? (cancelledTickets / totalTickets) * 100 : 0;
      const successRate = totalTickets > 0 ? (validTickets / totalTickets) * 100 : 0;
      
      const refundMetrics = {
        labels: ["Successful Sales", "Refunded", "Cancelled"],
        values: [successRate, refundRate, cancelRate],
      };
      
      return {
        revenueByPeriod: {
          labels,
          revenue: revenueByMonth,
          tickets: ticketsByMonth,
        },
        revenueByMethod,
        salesByTimeOfDay,
        platformGrowth: {
          labels,
          revenue: revenueByMonth,
          tickets: ticketsByMonth,
          events: eventsByMonth,
          users: usersByMonth,
        },
        conversionMetrics,
        refundMetrics,
      };
    },
  });
  
  // Get events analytics data
  export const getEventsAnalytics = query({
    handler: async (ctx) => {
      const events = await ctx.db.query("events").collect();
      const tickets = await ctx.db.query("tickets").collect();
      
      // Get current date for calculations
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Events by period (last 12 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const labels = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const year = currentMonth - monthIndex < 0 ? currentYear - 1 : currentYear;
        return `${months[monthIndex]} ${year}`;
      });
      
      // Calculate events created per month
      const eventsByMonth = Array(12).fill(0);
      events.forEach(event => {
        const date = new Date(event._creationTime);
        const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
        
        if (monthsAgo < 12) {
          const index = 11 - monthsAgo;
          eventsByMonth[index]++;
        }
      });
      
      // Events by category - extract from event name or description since there's no category field
      const categoriesMap = new Map();
      events.forEach(event => {
        // Simplified category extraction - in a real app, you'd have an actual category field
        let category = "Other";
        const name = event.name.toLowerCase();
        
        if (name.includes("music") || name.includes("concert") || name.includes("festival")) {
          category = "Music";
        } else if (name.includes("tech") || name.includes("conference") || name.includes("workshop")) {
          category = "Technology";
        } else if (name.includes("sports") || name.includes("game") || name.includes("match")) {
          category = "Sports";
        } else if (name.includes("art") || name.includes("exhibition") || name.includes("gallery")) {
          category = "Arts & Culture";
        } else if (name.includes("food") || name.includes("drink") || name.includes("tasting")) {
          category = "Food & Drink";
        }
        
        const count = categoriesMap.get(category) || 0;
        categoriesMap.set(category, count + 1);
      });
      
      const eventsByCategory = {
        labels: Array.from(categoriesMap.keys()),
        values: Array.from(categoriesMap.values()),
      };
      
      // Calculate event fill rates
      const eventFillRates = new Map();
      events.forEach(event => {
        const eventTickets = tickets.filter(ticket => 
          ticket.eventId === event._id && 
          (ticket.status === "valid" || ticket.status === "used")
        );
        
        const fillRate = event.totalTickets > 0 
          ? (eventTickets.length / event.totalTickets) * 100
          : 0;
        
        const fillRateCategory = fillRate >= 90 ? "90-100% Full" :
                                fillRate >= 75 ? "75-90% Full" :
                                fillRate >= 50 ? "50-75% Full" :
                                fillRate >= 25 ? "25-50% Full" :
                                "0-25% Full";
        
        const count = eventFillRates.get(fillRateCategory) || 0;
        eventFillRates.set(fillRateCategory, count + 1);
      });
      
      const eventFillRate = {
        labels: Array.from(eventFillRates.keys()),
        values: Array.from(eventFillRates.values()),
      };
      
      // Ticket utilization (valid vs used)
      const validTickets = tickets.filter(ticket => ticket.status === "valid").length;
      const usedTickets = tickets.filter(ticket => ticket.status === "used").length;
      const totalActiveTickets = validTickets + usedTickets;
      
      const validPercentage = totalActiveTickets > 0 ? (validTickets / totalActiveTickets) * 100 : 0;
      const usedPercentage = totalActiveTickets > 0 ? (usedTickets / totalActiveTickets) * 100 : 0;
      
      const ticketUtilization = {
        labels: ["Valid (Unused)", "Used"],
        values: [validPercentage, usedPercentage],
      };
      
      return {
        eventsByPeriod: {
          labels,
          events: eventsByMonth,
        },
        eventsByCategory,
        eventFillRate,
        ticketUtilization,
      };
    },
  });
  
  // Get user growth analytics data
  export const getUserGrowthAnalytics = query({
    handler: async (ctx) => {
      const users = await ctx.db.query("users").collect();
      const tickets = await ctx.db.query("tickets").collect();
      const payments = await ctx.db.query("payments").collect();
      
      // Get current date for calculations
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // User growth by period (last 12 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const labels = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = (currentMonth - 11 + i + 12) % 12;
        const year = currentMonth - monthIndex < 0 ? currentYear - 1 : currentYear;
        return `${months[monthIndex]} ${year}`;
      });
      
      // Calculate new users per month
      const newUsersByMonth = Array(12).fill(0);
      const userIds = [];
      
      users.forEach(user => {
        const date = new Date(user._creationTime);
        const monthsAgo = (currentMonth - date.getMonth() + 12) % 12;
        
        if (monthsAgo < 12) {
          const index = 11 - monthsAgo;
          newUsersByMonth[index]++;
        }
        
        userIds.push(user.userId);
      });
      
      // Calculate cumulative users over time
      const cumulativeUsersByMonth = [];
      let runningTotal = 0;
      
      for (let i = 0; i < 12; i++) {
        runningTotal += newUsersByMonth[i];
        cumulativeUsersByMonth.push(runningTotal);
      }
      
      // Calculate active users (users who made a purchase in the last 30 days)
      const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);
      const activeUserIds = new Set();
      
      tickets
        .filter(ticket => ticket.purchasedAt > thirtyDaysAgo)
        .forEach(ticket => {
          activeUserIds.add(ticket.userId);
        });
      
      const activeUsersCount = activeUserIds.size;
      const activeUsersPercentage = users.length > 0 ? (activeUsersCount / users.length) * 100 : 0;
      
      // User activity distribution
      const userActivityMap = new Map([
        ["No Purchases", 0],
        ["1 Purchase", 0],
        ["2-5 Purchases", 0],
        ["6-10 Purchases", 0],
        ["10+ Purchases", 0],
      ]);
      
      // Count tickets per user
      const ticketsPerUser = {};
      tickets.forEach(ticket => {
        if (!ticketsPerUser[ticket.userId]) {
          ticketsPerUser[ticket.userId] = 0;
        }
        ticketsPerUser[ticket.userId]++;
      });
      
      // Update user activity distribution
      userIds.forEach(userId => {
        const purchaseCount = ticketsPerUser[userId] || 0;
        
        if (purchaseCount === 0) {
          userActivityMap.set("No Purchases", userActivityMap.get("No Purchases") + 1);
        } else if (purchaseCount === 1) {
          userActivityMap.set("1 Purchase", userActivityMap.get("1 Purchase") + 1);
        } else if (purchaseCount >= 2 && purchaseCount <= 5) {
          userActivityMap.set("2-5 Purchases", userActivityMap.get("2-5 Purchases") + 1);
        } else if (purchaseCount >= 6 && purchaseCount <= 10) {
          userActivityMap.set("6-10 Purchases", userActivityMap.get("6-10 Purchases") + 1);
        } else {
          userActivityMap.set("10+ Purchases", userActivityMap.get("10+ Purchases") + 1);
        }
      });
      
      const userActivityDistribution = {
        labels: Array.from(userActivityMap.keys()),
        values: Array.from(userActivityMap.values()),
      };
      
      // Average spend per user type
      const userSpendMap = new Map();
      
      // Calculate total spend per user
      const userSpend = {};
      payments
        .filter(payment => payment.status === "completed")
        .forEach(payment => {
          if (!userSpend[payment.userId]) {
            userSpend[payment.userId] = 0;
          }
          userSpend[payment.userId] += payment.amount;
        });
      
      // Categorize users by spend
      Object.entries(userSpend).forEach(([userId, totalSpend]) => {
        const spend = Number(totalSpend);
        let category;
        
        if (spend < 1000) {
          category = "Low Spender (<1,000 KSh)";
        } else if (spend < 5000) {
          category = "Medium Spender (1,000-5,000 KSh)";
        } else if (spend < 10000) {
          category = "High Spender (5,000-10,000 KSh)";
        } else {
          category = "VIP Spender (10,000+ KSh)";
        }
        
        if (!userSpendMap.has(category)) {
          userSpendMap.set(category, {
            count: 0,
            totalSpend: 0,
          });
        }
        
        const data = userSpendMap.get(category);
        data.count++;
        data.totalSpend += spend;
      });
      
      // Calculate average spend per category
      const averageSpendByUserType = {
        labels: [],
        values: [],
      };
      
      userSpendMap.forEach((data, category) => {
        averageSpendByUserType.labels.push(category);
        averageSpendByUserType.values.push(data.count > 0 ? Math.round(data.totalSpend / data.count) : 0);
      });
      
      return {
        userGrowthByPeriod: {
          labels,
          newUsers: newUsersByMonth,
          cumulativeUsers: cumulativeUsersByMonth,
          activeUsers: Array(12).fill(activeUsersCount),
        },
        userActivityDistribution,
        averageSpendByUserType,
        activeUsers: {
          count: activeUsersCount,
          percentage: activeUsersPercentage,
        },
      };
    },
  });
  
  // Get top selling events
  export const getTopSellingEvents = query({
    handler: async (ctx) => {
      const events = await ctx.db.query("events").collect();
      const tickets = await ctx.db.query("tickets").collect();
      const payments = await ctx.db.query("payments").collect();
      
      // Calculate metrics for each event
      const eventMetrics = events.map(event => {
        const eventTickets = tickets.filter(ticket => 
          ticket.eventId === event._id && 
          (ticket.status === "valid" || ticket.status === "used")
        );
        
        const eventPayments = payments.filter(payment => 
          payment.eventId === event._id && 
          payment.status === "completed"
        );
        
        const revenue = eventPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculate sales velocity (tickets sold per day)
        const creationTime = new Date(event._creationTime).getTime();
        const now = Date.now();
        const daysSinceCreation = Math.max(1, Math.floor((now - creationTime) / (24 * 60 * 60 * 1000)));
        const salesVelocity = eventTickets.length / daysSinceCreation;
        
        return {
          _id: event._id,
          name: event.name,
          ticketsSold: eventTickets.length,
          totalTickets: event.totalTickets,
          revenue,
          salesVelocity,
        };
      });
      
      // Sort events by revenue (descending)
      const topEvents = eventMetrics
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      return topEvents;
    },
  });


// Get system settings from the database
export const getSystemSettings = query({
    handler: async (ctx) => {
      // Fetch all settings from the database
      const settingsRows = await ctx.db.query("settings").collect();
      
      // Transform into a key-value object
      const settingsMap = settingsRows.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      // Create the settings structure with defaults
      return {
        general: {
          siteName: settingsMap["siteName"] || "TicketBaze",
          contactEmail: settingsMap["contactEmail"] || "support@ticketbaze.com",
          supportPhone: settingsMap["supportPhone"] || "",
          defaultCurrency: settingsMap["defaultCurrency"] || "KES",
          timezone: settingsMap["timezone"] || "Africa/Nairobi",
        },
        payment: {
          paystackEnabled: settingsMap["paystackEnabled"] !== undefined ? settingsMap["paystackEnabled"] : true,
          paystackPublicKey: settingsMap["paystackPublicKey"] || "",
          paymentMethods: settingsMap["paymentMethods"] || ["paystack"],
          refundPolicy: settingsMap["refundPolicy"] || "Refunds are available up to 72 hours before the event starts.",
        },
        email: {
          senderName: settingsMap["emailSenderName"] || "TicketBaze",
          senderEmail: settingsMap["emailSenderEmail"] || "noreply@ticketbaze.com",
          templates: settingsMap["emailTemplates"] || [
            {
              id: "welcome",
              name: "Welcome Email",
              subject: "Welcome to TicketBaze",
              isActive: true,
            },
            {
              id: "ticket-purchase",
              name: "Ticket Purchase Confirmation",
              subject: "Your TicketBaze Purchase Confirmation",
              isActive: true,
            },
          ],
        },
        security: {
          ticketExpiryMinutes: settingsMap["ticketExpiryMinutes"] || 30,
          maxTicketsPerUser: settingsMap["maxTicketsPerUser"] || 5,
          adminEmails: settingsMap["adminEmails"] || [],
        },
      };
    },
  });
  
  // Helper function to update a setting
  async function updateSetting(ctx: any, key: string, value: any, userId?: string) {
    // Check if setting exists
    const existingSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    
    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    } else {
      // Create new setting
      await ctx.db.insert("settings", {
        key,
        value,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }
  }
  
  // Update general settings
  export const updateGeneralSettings = mutation({
    args: {
      settings: v.object({
        siteName: v.string(),
        contactEmail: v.string(),
        supportPhone: v.string(),
        defaultCurrency: v.string(),
        timezone: v.string(),
      }),
    },
    handler: async (ctx, args) => {
      const auth = await ctx.auth.getUserIdentity();
      const userId = auth?.subject;
      
      // Update each setting individually
      await updateSetting(ctx, "siteName", args.settings.siteName, userId);
      await updateSetting(ctx, "contactEmail", args.settings.contactEmail, userId);
      await updateSetting(ctx, "supportPhone", args.settings.supportPhone, userId);
      await updateSetting(ctx, "defaultCurrency", args.settings.defaultCurrency, userId);
      await updateSetting(ctx, "timezone", args.settings.timezone, userId);
      
      return { success: true };
    },
  });
  
  // Update payment settings
  export const updatePaymentSettings = mutation({
    args: {
      settings: v.object({
        paystackEnabled: v.boolean(),
        paystackPublicKey: v.string(),
        paymentMethods: v.array(v.string()),
        refundPolicy: v.string(),
      }),
    },
    handler: async (ctx, args) => {
      const auth = await ctx.auth.getUserIdentity();
      const userId = auth?.subject;
      
      await updateSetting(ctx, "paystackEnabled", args.settings.paystackEnabled, userId);
      await updateSetting(ctx, "paystackPublicKey", args.settings.paystackPublicKey, userId);
      await updateSetting(ctx, "paymentMethods", args.settings.paymentMethods, userId);
      await updateSetting(ctx, "refundPolicy", args.settings.refundPolicy, userId);
      
      return { success: true };
    },
  });
  
  // Update email settings
  export const updateEmailSettings = mutation({
    args: {
      settings: v.object({
        senderName: v.string(),
        senderEmail: v.string(),
        templates: v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            subject: v.string(),
            isActive: v.boolean(),
          })
        ),
      }),
    },
    handler: async (ctx, args) => {
      const auth = await ctx.auth.getUserIdentity();
      const userId = auth?.subject;
      
      await updateSetting(ctx, "emailSenderName", args.settings.senderName, userId);
      await updateSetting(ctx, "emailSenderEmail", args.settings.senderEmail, userId);
      await updateSetting(ctx, "emailTemplates", args.settings.templates, userId);
      
      return { success: true };
    },
  });
  
  // Send test email
  export const sendTestEmail = mutation({
    args: {
      recipient: v.string(),
      sender: v.string(),
      senderName: v.string(),
    },
    handler: async (ctx, args) => {
      // In a production environment, you would integrate with an email service like SendGrid, Mailgun, etc.
      // For demonstration purposes, we'll log the attempt and return success
      console.log(`[TEST EMAIL] Sending test email from ${args.senderName} <${args.sender}> to ${args.recipient}`);
      
      // Log the email attempt to the database for tracking
      await ctx.db.insert("emails", {
        to: args.recipient,
        from: args.sender,
        fromName: args.senderName,
        subject: "TicketBaze Test Email",
        body: "This is a test email from TicketBaze admin dashboard.",
        status: "sent",
        sentAt: Date.now(),
      });
      
      return { success: true };
    },
  });
  
  // Update security settings
  export const updateSecuritySettings = mutation({
    args: {
      settings: v.object({
        ticketExpiryMinutes: v.number(),
        maxTicketsPerUser: v.number(),
        adminEmails: v.array(v.string()),
      }),
    },
    handler: async (ctx, args) => {
      const auth = await ctx.auth.getUserIdentity();
      const userId = auth?.subject;
      
      await updateSetting(ctx, "ticketExpiryMinutes", args.settings.ticketExpiryMinutes, userId);
      await updateSetting(ctx, "maxTicketsPerUser", args.settings.maxTicketsPerUser, userId);
      await updateSetting(ctx, "adminEmails", args.settings.adminEmails, userId);
      
      return { success: true };
    },
  });
  
  // Update admin users
  export const updateAdminUsers = mutation({
    args: {
      adminEmails: v.array(v.string()),
    },
    handler: async (ctx, args) => {
      const auth = await ctx.auth.getUserIdentity();
      const userId = auth?.subject;
      
      // Update admin emails in settings
      await updateSetting(ctx, "adminEmails", args.adminEmails, userId);
      
      // Optionally, also update environment variable or other configuration
      // This would require server-side code outside of Convex
      
      return { success: true };
    },
  });
  
  // Get admin user status (checks if a user is an admin)
  export const isUserAdmin = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
      // Get the user's email from the users table
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      
      if (!user || !user.email) {
        return false;
      }
      
      // Get admin emails from settings
      const adminEmailsSetting = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "adminEmails"))
        .first();
      
      const adminEmails = adminEmailsSetting?.value || [];
      
      // Check if the user's email is in the admin list
      return adminEmails.includes(user.email);
    },
  });