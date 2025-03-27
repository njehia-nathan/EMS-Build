// components/admin/TicketsFilter.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TicketsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [eventDate, setEventDate] = useState(searchParams.get("eventDate") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set("q", search);
    if (status !== "all") params.set("status", status);
    if (eventDate !== "all") params.set("eventDate", eventDate);
    if (sortBy) params.set("sort", sortBy);
    
    router.push(`/admin/tickets?${params.toString()}`);
  };
  
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setEventDate("all");
    setSortBy("newest");
    router.push("/admin/tickets");
  };
  
  const hasActiveFilters = search || status !== "all" || eventDate !== "all" || sortBy !== "newest";
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by user or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={eventDate} onValueChange={setEventDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming Events</SelectItem>
              <SelectItem value="past">Past Events</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Purchase Date (Newest)</SelectItem>
              <SelectItem value="oldest">Purchase Date (Oldest)</SelectItem>
              <SelectItem value="event-asc">Event Date (Ascending)</SelectItem>
              <SelectItem value="event-desc">Event Date (Descending)</SelectItem>
              <SelectItem value="event-name">Event Name</SelectItem>
              <SelectItem value="user-name">User Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={resetFilters} disabled={!hasActiveFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button onClick={applyFilters}>
            <Filter className="h-4 w-4 mr-1" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}