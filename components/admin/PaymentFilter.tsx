// components/admin/PaymentFilter.tsx
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

export default function PaymentFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [method, setMethod] = useState(searchParams.get("method") || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set("q", search);
    if (status !== "all") params.set("status", status);
    if (method !== "all") params.set("method", method);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    
    router.push(`/admin/payments?${params.toString()}`);
  };
  
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setMethod("all");
    setDateFrom("");
    setDateTo("");
    router.push("/admin/payments");
  };
  
  const hasActiveFilters = search || status !== "all" || method !== "all" || dateFrom || dateTo;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by transaction ID, name or email..."
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
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="paystack">Paystack</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="card">Credit Card</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[140px]"
              placeholder="From"
            />
            <span className="text-gray-500">to</span>
            <Input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[140px]"
              placeholder="To"
            />
          </div>
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