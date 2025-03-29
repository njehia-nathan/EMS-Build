'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { X, User, ShoppingBag, Shield } from 'lucide-react';

export default function RoleSelectionDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const updateUserRole = useMutation(api.users.updateUserRole);
  
  // Admin secret code - in a real app, this would be stored securely
  const ADMIN_SECRET_CODE = 'superadmin123';
  
  useEffect(() => {
    // Check if user is signed in and hasn't selected a role yet
    if (isSignedIn && !hasSelectedRole) {
      // Check local storage to see if they've already selected a role
      const roleSelected = localStorage.getItem('roleSelected');
      if (!roleSelected) {
        setIsOpen(true);
      } else {
        setHasSelectedRole(true);
      }
    }
  }, [isSignedIn, hasSelectedRole]);
  
  const handleRoleSelection = async (role: 'user' | 'seller' | 'superadmin') => {
    if (!user) return;
    
    try {
      // If trying to become admin, verify the code
      if (role === 'superadmin') {
        if (adminCodeInput !== ADMIN_SECRET_CODE) {
          setError('Invalid admin code');
          return;
        }
      }
      
      // Update user role in the database
      await updateUserRole({
        userId: user.id,
        role: role
      });
      
      // Store in local storage to prevent showing dialog again
      localStorage.setItem('roleSelected', 'true');
      setHasSelectedRole(true);
      setIsOpen(false);
      
      // Redirect based on role
      if (role === 'superadmin') {
        router.push('/admin');
      } else if (role === 'seller') {
        router.push('/seller');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update role. Please try again.');
    }
  };
  
  // Secret admin trigger - clicking 10 times in a specific area
  const [adminClickCount, setAdminClickCount] = useState(0);
  
  const handleSecretAdminClick = () => {
    setAdminClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        setShowAdminInput(true);
        return 0;
      }
      return newCount;
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Select Your Role</h2>
          <button 
            onClick={() => {
              localStorage.setItem('roleSelected', 'true');
              setHasSelectedRole(true);
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 p-3 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <p className="text-gray-600 mb-6">
          Choose how you want to use our platform:
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('user')}
            className="w-full flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="h-6 w-6 text-blue-500 mr-3" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Regular User</h3>
              <p className="text-sm text-gray-500">Browse and purchase tickets for events</p>
            </div>
          </button>
          
          <button
            onClick={() => handleRoleSelection('seller')}
            className="w-full flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-6 w-6 text-green-500 mr-3" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Event Seller</h3>
              <p className="text-sm text-gray-500">Create and manage your own events</p>
            </div>
          </button>
          
          {showAdminInput && (
            <div className="mt-4 p-4 border border-gray-300 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Admin Access</h3>
              <input
                type="password"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                placeholder="Enter admin code"
                className="w-full p-2 border border-gray-300 rounded mb-2"
              />
              <button
                onClick={() => handleRoleSelection('superadmin')}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <Shield className="h-5 w-5 mr-2" />
                Access Admin Panel
              </button>
            </div>
          )}
        </div>
        
        {/* Secret admin trigger area */}
        <div 
          className="mt-8 h-4 w-4 mx-auto opacity-0"
          onClick={handleSecretAdminClick}
        ></div>
        
        <p className="text-xs text-gray-500 text-center mt-6">
          You can change your role later in account settings
        </p>
      </div>
    </div>
  );
}
