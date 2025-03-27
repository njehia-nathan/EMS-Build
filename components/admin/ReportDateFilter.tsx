// components/admin/ReportDateFilter.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ReportDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [range, setRange] = useState(searchParams.get("range") || "30days");
  const [fromDate, setFromDate] = useState<Date | undefined>(
    searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined
  );
  
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (range && range !== "custom") {
      params.set("range", range);
    } else if (fromDate && toDate) {
      params.set("from", fromDate.toISOString().split('T')[0]);
      params.set("to", toDate.toISOString().split('T')[0]);
    }
    
    router.push(`/admin/reports?${params.toString()}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-grow">
          <Select 
            value={range} 
            onValueChange={(value) => {
              setRange(value);
              if (value !== "custom") {
                setFromDate(undefined);
                setToDate(undefined);
              }
            }}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[200px] justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[200px] justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  disabled={(date) => 
                    (fromDate ? date < fromDate : false) || date > new Date()
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        <Button onClick={applyFilters} className="whitespace-nowrap">
          Apply Range
        </Button>
      </div>
    </div>
  );
}