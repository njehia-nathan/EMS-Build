'use client';

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Settings, CreditCard, User, Save, CheckCircle } from "lucide-react";

interface SellerSettingsClientProps {
  user: {
    _id: string;
    name: string;
    email: string;
    userId: string;
    role?: string;
    paystackRecipientCode?: string;
  };
}

export default function SellerSettingsClient({ user }: SellerSettingsClientProps) {
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState('account');
  const [paystackRecipientCode, setPaystackRecipientCode] = useState(user.paystackRecipientCode || '');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const updatePaystackRecipientCode = useMutation(api.users.updatePaystackRecipientCode);
  
  // Handle payout settings update
  const handlePayoutSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      // In a real implementation, you would create a Paystack recipient here
      // and get the recipient code from the response
      // For now, we'll just use the manually entered code
      
      await updatePaystackRecipientCode({
        userId: user.userId,
        paystackRecipientCode: paystackRecipientCode
      });
      
      setSuccessMessage('Payout settings updated successfully');
    } catch (error) {
      console.error('Error updating payout settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('account')}
            className={`${
              activeTab === 'account'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
          >
            <User className="mr-2 h-5 w-5" />
            Account
          </button>
          <button
            onClick={() => setActiveTab('payout')}
            className={`${
              activeTab === 'payout'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Payout Settings
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
          >
            <Settings className="mr-2 h-5 w-5" />
            Preferences
          </button>
        </nav>
      </div>
      
      {/* Account Settings */}
      {activeTab === 'account' && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your personal details and account settings.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={clerkUser?.fullName || user.name}
                    disabled
                    className="flex-1 block w-full rounded-md sm:text-sm border-gray-300 bg-gray-100"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  To change your name, update your profile in the account settings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="email"
                    value={clerkUser?.primaryEmailAddress?.emailAddress || user.email}
                    disabled
                    className="flex-1 block w-full rounded-md sm:text-sm border-gray-300 bg-gray-100"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  To change your email, update your profile in the account settings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={user.role || 'Seller'}
                    disabled
                    className="flex-1 block w-full rounded-md sm:text-sm border-gray-300 bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payout Settings */}
      {activeTab === 'payout' && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Payout Settings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure how you receive payments from your events.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handlePayoutSettingsUpdate}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Paystack Recipient Code
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={paystackRecipientCode}
                      onChange={(e) => setPaystackRecipientCode(e.target.value)}
                      className="flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Enter your Paystack recipient code"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This code is used to send payouts to your bank account.
                  </p>
                </div>
                
                <div className="sm:col-span-2 border-t border-gray-200 pt-5">
                  <h4 className="text-md font-medium text-gray-900">Create Paystack Recipient</h4>
                  <p className="mt-1 text-sm text-gray-500 mb-4">
                    If you don't have a recipient code, you can create one by entering your bank details below.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Enter account name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Enter account number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Code</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      className="flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Enter bank code"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={!accountName || !accountNumber || !bankCode}
                  >
                    Create Recipient
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    Note: This is a placeholder. In a real implementation, this would create a recipient via the Paystack API.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Preferences */}
      {activeTab === 'preferences' && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Customize your seller experience.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <div className="mt-2 space-y-2">
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="sales"
                        name="sales"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="sales" className="font-medium text-gray-700">
                        Sales notifications
                      </label>
                      <p className="text-gray-500">Receive an email when you make a sale.</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="payouts"
                        name="payouts"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="payouts" className="font-medium text-gray-700">
                        Payout notifications
                      </label>
                      <p className="text-gray-500">Receive an email when a payout is processed.</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="marketing"
                        name="marketing"
                        type="checkbox"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="marketing" className="font-medium text-gray-700">
                        Marketing emails
                      </label>
                      <p className="text-gray-500">Receive tips, product updates and other marketing communications.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Default Commission Rate</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Set the default commission rate for your events. This can be overridden for individual events.
                </p>
                <div className="mt-2 max-w-xs">
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="10"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
