'use client';

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Shield, User, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface UserRoleManagerProps {
  userId: string;
  currentRole?: string;
}

export default function UserRoleManager({ userId, currentRole = "user" }: UserRoleManagerProps) {
  const [role, setRole] = useState<string>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const updateUserRole = useMutation(api.users.updateUserRole);
  
  const handleRoleChange = async () => {
    if (role === currentRole) return;
    
    try {
      setIsUpdating(true);
      await updateUserRole({ 
        userId, 
        role: role as "superadmin" | "seller" | "user" 
      });
      
      toast.success(`User role updated to ${role}`);
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case "superadmin":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "seller":
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-3">Manage User Role</h3>
      <div className="flex items-center gap-2 mb-4">
        {getRoleIcon(currentRole)}
        <span className="text-sm">
          Current Role: <span className="font-medium capitalize">{currentRole}</span>
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
            Change Role
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role-select" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Regular User</span>
                </div>
              </SelectItem>
              <SelectItem value="seller">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Seller</span>
                </div>
              </SelectItem>
              <SelectItem value="superadmin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Superadmin</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleRoleChange} 
          disabled={role === currentRole || isUpdating}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Role"}
        </Button>
      </div>
    </div>
  );
}
