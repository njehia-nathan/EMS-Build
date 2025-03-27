// components/admin/settings/PaymentSettings.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type PaymentSettingsProps = {
  settings: {
    paystackEnabled: boolean;
    paystackPublicKey: string;
    paymentMethods: string[];
    refundPolicy: string;
  };
};

export default function PaymentSettings({ settings }: PaymentSettingsProps) {
  const [formData, setFormData] = useState(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateSettings = useMutation(api.admin.updatePaymentSettings);
  
  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const togglePaymentMethod = (method: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          paymentMethods: [...prev.paymentMethods, method]
        };
      } else {
        return {
          ...prev,
          paymentMethods: prev.paymentMethods.filter(m => m !== method)
        };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateSettings({
        settings: formData
      });
      
      toast.success("Payment settings updated successfully");
    } catch (error) {
      console.error("Failed to update payment settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Paystack Integration</h3>
              <p className="text-sm text-gray-500">Configure Paystack payment gateway</p>
            </div>
            <Switch
              checked={formData.paystackEnabled}
              onCheckedChange={(checked) => handleChange("paystackEnabled", checked)}
            />
          </div>
          
          {formData.paystackEnabled && (
            <div className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paystackPublicKey">Paystack Public Key</Label>
                <Input
                  id="paystackPublicKey"
                  value={formData.paystackPublicKey}
                  onChange={(e) => handleChange("paystackPublicKey", e.target.value)}
                  placeholder="pk_test_..."
                />
                <p className="text-xs text-gray-500">
                  Your Paystack public key can be found in your Paystack dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Payment Methods</h3>
            <p className="text-sm text-gray-500">Select which payment methods to accept</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paystack"
                checked={formData.paymentMethods.includes("paystack")}
                onCheckedChange={(checked) => 
                  togglePaymentMethod("paystack", checked as boolean)
                }
              />
              <Label htmlFor="paystack">Paystack</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mpesa"
                checked={formData.paymentMethods.includes("mpesa")}
                onCheckedChange={(checked) => 
                  togglePaymentMethod("mpesa", checked as boolean)
                }
              />
              <Label htmlFor="mpesa">M-Pesa</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="card"
                checked={formData.paymentMethods.includes("card")}
                onCheckedChange={(checked) => 
                  togglePaymentMethod("card", checked as boolean)
                }
              />
              <Label htmlFor="card">Credit/Debit Card</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bank"
                checked={formData.paymentMethods.includes("bank")}
                onCheckedChange={(checked) => 
                  togglePaymentMethod("bank", checked as boolean)
                }
              />
              <Label htmlFor="bank">Bank Transfer</Label>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Refund Policy</h3>
            <p className="text-sm text-gray-500">Set your platform's refund policy</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refundPolicy">Refund Policy</Label>
            <Textarea
              id="refundPolicy"
              value={formData.refundPolicy}
              onChange={(e) => handleChange("refundPolicy", e.target.value)}
              placeholder="Enter your refund policy..."
              rows={5}
            />
          </div>
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Payment Settings"
        )}
      </Button>
    </form>
  );
}