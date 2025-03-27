// components/admin/settings/EmailSettings.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Mail, Send } from "lucide-react";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  isActive: boolean;
};

type EmailSettingsProps = {
  settings: {
    senderName: string;
    senderEmail: string;
    templates: EmailTemplate[];
  };
};

export default function EmailSettings({ settings }: EmailSettingsProps) {
  const [formData, setFormData] = useState(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  
  const updateSettings = useMutation(api.admin.updateEmailSettings);
  const sendTestEmail = useMutation(api.admin.sendTestEmail);
  
  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const toggleTemplate = (id: string, isActive: boolean) => {
    setFormData(prev => ({
      ...prev,
      templates: prev.templates.map(template => 
        template.id === id ? { ...template, isActive } : template
      )
    }));
  };
  
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    try {
      await sendTestEmail({
        recipient: testEmail,
        sender: formData.senderEmail,
        senderName: formData.senderName,
      });
      
      toast.success("Test email sent successfully");
    } catch (error) {
      console.error("Failed to send test email:", error);
      toast.error("Failed to send test email");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateSettings({
        settings: formData
      });
      
      toast.success("Email settings updated successfully");
    } catch (error) {
      console.error("Failed to update email settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Email Sender Configuration</h3>
            <p className="text-sm text-gray-500">Configure your email sender details</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => handleChange("senderName", e.target.value)}
                placeholder="TicketBaze Support"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={formData.senderEmail}
                onChange={(e) => handleChange("senderEmail", e.target.value)}
                placeholder="support@ticketbaze.com"
              />
            </div>
          </div>
          
          <div className="pt-4 space-y-2">
            <Label htmlFor="testEmail">Send Test Email</Label>
            <div className="flex gap-2">
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter recipient email"
              />
              <Button 
                type="button" 
                onClick={handleSendTestEmail}
                variant="outline"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Email Templates</h3>
            <p className="text-sm text-gray-500">Manage your notification email templates</p>
          </div>
          
          <div className="space-y-4 pt-2">
            {formData.templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-gray-500">Subject: {template.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 mr-2">
                    {template.isActive ? "Active" : "Disabled"}
                  </span>
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                  />
                </div>
              </div>
            ))}
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
          "Save Email Settings"
        )}
      </Button>
    </form>
  );
}