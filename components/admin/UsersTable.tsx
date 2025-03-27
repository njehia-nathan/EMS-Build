// components/admin/UsersTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Ticket, Calendar, CreditCard } from "lucide-react";

type User = {
  _id: string;
  userId: string;
  name: string;
  email: string;
  ticketsCount: number;
  paymentsCount: number;
  eventsCreated: number;
  totalSpent: number;
  joinedAt: number;
  lastActive: number;
};

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<keyof User>("joinedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "name" || sortBy === "email") {
      return sortOrder === "asc" 
        ? a[sortBy].localeCompare(b[sortBy])
        : b[sortBy].localeCompare(a[sortBy]);
    } else {
      return sortOrder === "asc" 
        ? (a[sortBy] as number) - (b[sortBy] as number)
        : (b[sortBy] as number) - (a[sortBy] as number);
    }
  });
  
  const handleSort = (column: keyof User) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                User
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("ticketsCount")}
              >
                Tickets
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("eventsCreated")}
              >
                Events Created
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("totalSpent")}
              >
                Total Spent
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("joinedAt")}
              >
                Joined
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 text-blue-600 mr-2" />
                    {user.ticketsCount}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-green-600 mr-2" />
                    {user.eventsCreated}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-purple-600 mr-2" />
                    KSh {user.totalSpent.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.joinedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/users/${user.userId}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}