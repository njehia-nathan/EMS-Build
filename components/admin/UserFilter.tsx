// components/admin/UserFilter.tsx
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

export default function UserFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set("q", search);
    if (sort) params.set("sort", sort);
    if (filter !== "all") params.set("filter", filter);
    
    router.push(`/admin/users?${params.toString()}`);
  };
  
  const resetFilters = () => {
    setSearch("");
    setSort("newest");
    setFilter("all");
    router.push("/admin/users");
  };
  
  const hasActiveFilters = search || sort !== "newest" || filter !== "all";
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="tickets">Most Tickets</SelectItem>
              <SelectItem value="spent">Highest Spent</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="buyers">Ticket Buyers</SelectItem>
              <SelectItem value="sellers">Event Creators</SelectItem>
              <SelectItem value="active">Active Last 30 Days</SelectItem>
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