// app/admin/events/[id]/page.tsx
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, MapPin, Users, Ticket, DollarSign, Clock } from "lucide-react";
import EventTicketsTable from "@/components/admin/EventTicketsTable";
import EventPaymentsTable from "@/components/admin/EventPaymentsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function EventDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  try {
    const event = await convex.query(api.admin.getEventById, { 
      eventId: params.id as Id<"events"> 
    });
    
    const tickets = await convex.query(api.admin.getEventTickets, {
      eventId: params.id as Id<"events">
    });
    
    const payments = await convex.query(api.admin.getEventPayments, {
      eventId: params.id as Id<"events">
    });
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin/events" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {event.imageStorageId && (
                  <div className="relative h-64 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={`/api/storage/${event.imageStorageId}`}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <p className="text-gray-600 mb-4">{event.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p>{new Date(event.eventDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{event.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Tickets</p>
                      <p>{event.totalTickets}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Tickets Sold</p>
                      <p>{event.metrics.soldTickets}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p>KSh {event.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p>{new Date(event._creationTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Tickets Sold</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {event.metrics.soldTickets} / {event.totalTickets}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {Math.round((event.metrics.soldTickets / event.totalTickets) * 100)}% sold
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        KSh {event.metrics.revenue.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Refunded Tickets</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {event.metrics.refundedTickets}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Current Queue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {event.metrics.activeQueue || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">waiting users</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Status</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      event.is_cancelled
                        ? "bg-red-100 text-red-800"
                        : event.eventDate < Date.now()
                        ? "bg-gray-100 text-gray-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {event.is_cancelled
                        ? "Cancelled"
                        : event.eventDate < Date.now()
                        ? "Ended"
                        : "Active"}
                    </span>
                  </div>
                  
                  {event.is_cancelled ? (
                    <div className="text-sm text-red-600">
                      This event has been cancelled. All tickets have been refunded.
                    </div>
                  ) : event.eventDate < Date.now() ? (
                    <div className="text-sm text-gray-600">
                      This event has already taken place.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        This event is currently active and selling tickets.
                      </p>
                      <div className="flex gap-2">
                        <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                          Cancel Event
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                          Edit Event
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="tickets">
          <TabsList className="mb-4">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="tickets">
            <EventTicketsTable tickets={tickets} />
          </TabsContent>
          <TabsContent value="payments">
            <EventPaymentsTable payments={payments} />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error fetching event details:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: Could not find event with ID: {params.id}
        </div>
        <div className="mt-4">
          <Link href="/admin/events" className="text-blue-600 hover:text-blue-700">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }
}

export default EventDetailPage;