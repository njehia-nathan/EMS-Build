// components/admin/RecentActivities.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, ArrowUpRight } from "lucide-react";

type Activity = {
  _id: string;
  name?: string;
  amount?: number;
  date: number;
  status: string;
  [key: string]: any;
};

type RecentActivitiesProps = {
  title: string;
  data: Activity[];
  type: "events" | "payments";
};

export default function RecentActivities({ title, data, type }: RecentActivitiesProps) {
  const router = useRouter();
  
  const handleClick = (id: string) => {
    router.push(`/admin/${type}/${id}`);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        <button
          onClick={() => router.push(`/admin/${type}`)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View all <ArrowUpRight className="h-4 w-4 ml-1" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleClick(item._id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white border border-gray-200">
                  {type === "events" ? (
                    <Calendar className="h-5 w-5 text-blue-600" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {type === "events" ? item.name : `Payment #${item._id.substring(0, 8)}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {type === "payments" && (
                  <span className="font-medium text-gray-900">
                    KSh {item.amount?.toLocaleString()}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === "completed" || item.status === "valid" || item.status === "active"
                    ? "bg-green-100 text-green-800"
                    : item.status === "cancelled" || item.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent {type === "events" ? "events" : "payments"} to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}