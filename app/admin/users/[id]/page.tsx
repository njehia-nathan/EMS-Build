// app/admin/users/[id]/page.tsx
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Calendar, Ticket, CreditCard, AlertCircle } from "lucide-react";
import UserPurchasesTable from "@/components/admin/UserPurchasesTable";
import UserTicketsTable from "@/components/admin/UserTicketsTable";
import UserEventsTable from "@/components/admin/UserEventsTable";
import UserRoleManager from "@/components/admin/UserRoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function UserDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  const convex = getConvexClient();
  
  try {
    const user = await convex.query(api.admin.getUserById, { 
      userId: params.id
    });
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin/users" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* User Profile */}
              <div className="md:w-1/3">
                <div className="bg-gray-100 p-8 rounded-lg flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>User ID: {user.userId}</p>
                    <p>Joined: {new Date(user.stats.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {/* User Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Ticket className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Tickets</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{user.stats.ticketsCount}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 mb-1">
                      <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                      <span className="text-sm font-medium">Payments</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{user.stats.paymentsCount}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium">Events Created</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{user.stats.eventsCreated}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 mb-1">
                      <CreditCard className="w-4 h-4 mr-2 text-amber-600" />
                      <span className="text-sm font-medium">Total Spent</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">KSh {user.stats.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Admin Actions</h3>
                  <div className="space-y-2">
                    {user.stats.paymentsCount > 0 && (
                      <button className="w-full flex items-center justify-center gap-2 p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">
                        <AlertCircle className="w-4 h-4" />
                        View Payment History
                      </button>
                    )}
                    {user.stats.ticketsCount > 0 && (
                      <button className="w-full flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                        <Ticket className="w-4 h-4" />
                        Manage Tickets
                      </button>
                    )}
                  </div>
                </div>
                
                {/* User Role Manager */}
                <div className="mt-6">
                  <UserRoleManager userId={user.userId} currentRole={user.role || "user"} />
                </div>
              </div>
              
              {/* User Activity Tabs */}
              <div className="md:w-2/3">
                <Tabs defaultValue="tickets">
                  <TabsList className="mb-4">
                    <TabsTrigger value="tickets">Tickets ({user.tickets.length})</TabsTrigger>
                    <TabsTrigger value="payments">Payments ({user.payments.length})</TabsTrigger>
                    <TabsTrigger value="events">Events Created ({user.events.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tickets">
                    <UserTicketsTable tickets={user.tickets} />
                    {user.tickets.length === 0 && (
                      <div className="bg-gray-50 p-8 text-center rounded-lg">
                        <Ticket className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No tickets purchased</h3>
                        <p className="text-gray-500">This user hasn't purchased any tickets yet.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="payments">
                    <UserPurchasesTable payments={user.payments} />
                    {user.payments.length === 0 && (
                      <div className="bg-gray-50 p-8 text-center rounded-lg">
                        <CreditCard className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No payment history</h3>
                        <p className="text-gray-500">This user hasn't made any payments yet.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="events">
                    <UserEventsTable events={user.events} />
                    {user.events.length === 0 && (
                      <div className="bg-gray-50 p-8 text-center rounded-lg">
                        <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No events created</h3>
                        <p className="text-gray-500">This user hasn't created any events yet.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching user details:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: Could not find user with ID: {params.id}
        </div>
        <div className="mt-4">
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-700">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }
}

export default UserDetailPage;