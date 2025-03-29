'use client';

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CommissionSettings() {
  const { user } = useUser();
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the current default commission rate
  const defaultRate = useQuery(api.settings.getDefaultCommissionRate);
  const setDefaultRate = useMutation(api.settings.setDefaultCommissionRate);
  
  useEffect(() => {
    if (defaultRate !== undefined) {
      setCommissionRate(defaultRate);
    }
  }, [defaultRate]);
  
  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      await setDefaultRate({
        rate: commissionRate,
        userId: user.id
      });
      
      toast.success("Default commission rate updated successfully");
    } catch (error) {
      console.error("Failed to update commission rate:", error);
      toast.error("Failed to update commission rate. Make sure you have superadmin privileges.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Settings</CardTitle>
        <CardDescription>
          Set the default commission rate for all events. This can be overridden for individual events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Default Commission Rate (%)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-full h-4 bg-gray-200 rounded-full">
                <div 
                  className="h-4 bg-blue-600 rounded-full" 
                  style={{ width: `${commissionRate * 2}%` }}
                ></div>
              </div>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setCommissionRate(value);
                  }
                }}
                className="w-20"
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              The platform will take {commissionRate}% of each ticket sale.
            </p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <h4 className="text-sm font-medium text-amber-800">How commission works</h4>
            <p className="text-sm text-amber-700 mt-1">
              For a ticket priced at KSh 1,000 with {commissionRate}% commission:
            </p>
            <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc pl-5">
              <li>Platform fee: KSh {(1000 * commissionRate / 100).toFixed(2)}</li>
              <li>Seller receives: KSh {(1000 - (1000 * commissionRate / 100)).toFixed(2)}</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
