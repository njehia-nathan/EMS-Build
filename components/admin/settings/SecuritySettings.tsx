// components/admin/settings/SecuritySettings.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SecuritySettingsProps = {
  settings: {
    ticketExpiryMinutes: number;
    maxTicketsPerUser: number;
    adminEmails: string[];
  };
};

export default function SecuritySettings({ settings }: SecuritySettingsProps) {
  const [formData, setFormData] = useState(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateSettings = useMutation(api.admin.updateSecuritySettings);
  
  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateSettings({
        settings: formData
      });
      
      toast.success("Security settings updated successfully");
    } catch (error) {
      console.error("Failed to update security settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Security</CardTitle>
            <CardDescription>Configure ticket purchase security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticketExpiryMinutes">
                Ticket Offer Expiry (minutes)
              </Label>
              <Input
                id="ticketExpiryMinutes"
                type="number"
                value={formData.ticketExpiryMinutes}
                onChange={(e) => handleChange("ticketExpiryMinutes", parseInt(e.target.value))}
                min={1}
                max={120}
              />
              <p className="text-xs text-gray-500">
                How long a user has to complete their ticket purchase once offered
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxTicketsPerUser">
                Maximum Tickets Per User (per event)
              </Label>
              <Input
                id="maxTicketsPerUser"
                type="number"
                value={formData.maxTicketsPerUser}
                onChange={(e) => handleChange("maxTicketsPerUser", parseInt(e.target.value))}
                min={1}
                max={20}
              />
              <p className="text-xs text-gray-500">
                Maximum number of tickets a single user can purchase for one event
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Security</CardTitle>
            <CardDescription>Additional system security configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
              <Lock className="w-5 h-5 mr-3 shrink-0" />
              <div>
                <h4 className="font-medium">Security Best Practices</h4>
                <p className="text-sm mt-1">
                  All credentials are stored securely and encrypted. Regular security audits are performed.
                </p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
              <Shield className="w-5 h-5 mr-3 shrink-0" />
              <div>
                <h4 className="font-medium">Admin User Management</h4>
                <p className="text-sm mt-1">
                  Admin user management is available in the &quot;Admin Users&quot; tab.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Security Settings"
        )}
      </Button>
    </form>
  );
}