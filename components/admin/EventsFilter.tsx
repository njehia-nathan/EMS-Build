// components/admin/EventsFilter.tsx
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

export default function EventsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [dateRange, setDateRange] = useState(searchParams.get("date") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set("q", search);
    if (status !== "all") params.set("status", status);
    if (dateRange !== "all") params.set("date", dateRange);
    if (sortBy) params.set("sort", sortBy);
    
    router.push(`/admin/events?${params.toString()}`);
  };
  
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setDateRange("all");
    setSortBy("newest");
    router.push("/admin/events");
  };
  
  const hasActiveFilters = search || status !== "all" || dateRange !== "all" || sortBy !== "newest";
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search events..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="tickets">Most Tickets Sold</SelectItem>
              <SelectItem value="revenue">Highest Revenue</SelectItem>
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