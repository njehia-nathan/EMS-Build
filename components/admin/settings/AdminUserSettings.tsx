// components/admin/settings/AdminUserSettings.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserCog } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminUserSettingsProps = {
  adminEmails: string[];
};

export default function AdminUserSettings({ adminEmails }: AdminUserSettingsProps) {
  const [emails, setEmails] = useState(adminEmails);
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateAdminUsers = useMutation(api.admin.updateAdminUsers);
  
  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (emails.includes(newEmail)) {
      toast.error("This email is already in the list");
      return;
    }
    
    setEmails([...emails, newEmail]);
    setNewEmail("");
  };
  
  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateAdminUsers({
        adminEmails: emails
      });
      
      toast.success("Admin users updated successfully");
    } catch (error) {
      console.error("Failed to update admin users:", error);
      toast.error("Failed to update admin users");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <UserCog className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-blue-800">Admin User Management</h3>
            <p className="text-sm text-blue-700 mt-1">
              Manage email addresses that have administrative access to the platform. 
              These users will be able to access the admin dashboard and manage system settings.
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="newAdminEmail" className="text-sm font-medium text-gray-700 mb-1 block">
                Add New Admin Email
              </label>
              <Input
                id="newAdminEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddEmail}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          
          <div className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length > 0 ? (
                  emails.map((email) => (
                    <TableRow key={email}>
                      <TableCell>{email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No admin users added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
          "Save Admin Users"
        )}
      </Button>
    </form>
  );
}