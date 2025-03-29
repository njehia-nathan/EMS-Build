// components/admin/SettingsTabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettings from "./settings/GeneralSettings";
import PaymentSettings from "./settings/PaymentSettings";
import EmailSettings from "./settings/EmailSettings";
import SecuritySettings from "./settings/SecuritySettings";
import AdminUserSettings from "./settings/AdminUserSettings";
import CommissionSettings from "./CommissionSettings";

type SettingsProps = {
  settings: {
    general: {
      siteName: string;
      contactEmail: string;
      supportPhone: string;
      defaultCurrency: string;
      timezone: string;
    };
    payment: {
      paystackEnabled: boolean;
      paystackPublicKey: string;
      paymentMethods: string[];
      refundPolicy: string;
    };
    email: {
      senderName: string;
      senderEmail: string;
      templates: {
        id: string;
        name: string;
        subject: string;
        isActive: boolean;
      }[];
    };
    security: {
      ticketExpiryMinutes: number;
      maxTicketsPerUser: number;
      adminEmails: string[];
    };
  };
};

export default function SettingsTabs({ settings }: SettingsProps) {
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="payment">Payment</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="commission">Commission</TabsTrigger>
        <TabsTrigger value="admins">Admin Users</TabsTrigger>
      </TabsList>
      
      <div className="p-6">
        <TabsContent value="general" className={activeTab === "general" ? "block" : "hidden"}>
          <GeneralSettings settings={settings.general} />
        </TabsContent>
        
        <TabsContent value="payment" className={activeTab === "payment" ? "block" : "hidden"}>
          <PaymentSettings settings={settings.payment} />
        </TabsContent>
        
        <TabsContent value="email" className={activeTab === "email" ? "block" : "hidden"}>
          <EmailSettings settings={settings.email} />
        </TabsContent>
        
        <TabsContent value="security" className={activeTab === "security" ? "block" : "hidden"}>
          <SecuritySettings settings={settings.security} />
        </TabsContent>
        
        <TabsContent value="commission" className={activeTab === "commission" ? "block" : "hidden"}>
          <CommissionSettings />
        </TabsContent>
        
        <TabsContent value="admins" className={activeTab === "admins" ? "block" : "hidden"}>
          <AdminUserSettings adminEmails={settings.security.adminEmails} />
        </TabsContent>
      </div>
    </Tabs>
  );
}