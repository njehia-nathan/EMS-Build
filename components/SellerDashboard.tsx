"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

const orders = [
  { id: "1", event: "Tech Conference 2024", date: "2024-12-15", price: "KSH 15,000", status: "Paid" },
  { id: "2", event: "Music Festival", date: "2024-11-20", price: "KSH 8,000", status: "Cancelled" },
  { id: "3", event: "Business Summit", date: "2024-10-05", price: "KSH 12,000", status: "Paid" },
  { id: "4", event: "Food & Wine Expo", date: "2024-09-25", price: "KSH 5,000", status: "Cancelled" },
  { id: "5", event: "Digital Marketing Workshop", date: "2024-08-30", price: "KSH 7,500", status: "Paid" },
];

const totalSales = orders
  .filter(order => order.status === "Paid")
  .reduce((sum, order) => sum + parseInt(order.price.replace(/[^0-9]/g, "")), 0);

const cancelledOrders = orders.filter(order => order.status === "Cancelled").length;
const completedOrders = orders.filter(order => order.status === "Paid").length;

const SellerDashboard = () => {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">KSH {totalSales.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Cancelled Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{completedOrders}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button className="bg-blue-500 text-white py-3 px-6 rounded-xl shadow-sm hover:bg-blue-600" onClick={() => router.push("/seller/new-event")}>
          Create New Event
        </Button>
        <button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300" onClick={() => router.push("/seller/events")}>View My Events</button>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-b border-gray-200">
                  <TableCell>{order.event}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.price}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      order.status === "Paid" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6">
        <Button className="bg-blue-500 text-white py-3 px-6 rounded-xl shadow-sm hover:bg-blue-600" onClick={() => router.push("/seller/payouts")}>
          Go to Payouts
        </Button>
      </div>
    </div>
  );
};

export default SellerDashboard;
