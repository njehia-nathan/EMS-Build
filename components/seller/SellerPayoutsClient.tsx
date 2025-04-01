'use client';

import { useState } from "react";
import { DollarSign, Calendar, ArrowDownCircle, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Payout {
  _id: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: number;
  processedAt?: number;
  failureReason?: string;
}

interface SellerPayoutsClientProps {
  payouts: Payout[];
  sellerId: string;
}

export default function SellerPayoutsClient({ payouts, sellerId }: SellerPayoutsClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Get real-time pending payments data
  const realtimePendingPayments = useQuery(api.seller.getPendingPayouts, { 
    sellerId 
  }) || [];
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Combine server-rendered payouts with real-time pending payments
  const allPayouts = [...payouts];
  
  // If we have real-time pending payments data, use it instead of the server-rendered pending payments
  if (realtimePendingPayments.length > 0) {
    // Filter out any server-rendered pending payouts
    const nonPendingPayouts = payouts.filter(p => p.status !== 'pending');
    
    // Combine with real-time pending payouts
    allPayouts.splice(0, allPayouts.length, ...nonPendingPayouts, ...realtimePendingPayments);
  }
  
  // Apply filters
  const filteredPayouts = statusFilter === 'all' 
    ? allPayouts 
    : allPayouts.filter(payout => payout.status === statusFilter);
  
  // Sort payouts by date (newest first)
  const sortedPayouts = [...filteredPayouts].sort((a, b) => b.createdAt - a.createdAt);
  
  // Calculate totals
  const totalPaid = allPayouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = allPayouts
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payouts</h1>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Payouts</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Total Paid */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatCurrency(totalPaid, true)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pending Payouts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payouts</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatCurrency(totalPending, true)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payouts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Payout History</h3>
        </div>
        {sortedPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPayouts.map((payout) => (
                  <tr key={payout._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payout.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payout.amount, true)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${payout.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payout.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {payout.status}
                      </span>
                      {payout.failureReason && (
                        <div className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {payout.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.processedAt ? formatDate(payout.processedAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No payouts found</p>
            <div className="mt-4 flex justify-center">
              <ArrowDownCircle className="h-12 w-12 text-gray-300" />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Payouts are processed automatically when you receive payments for your events
            </p>
          </div>
        )}
      </div>
      
      {/* Payout Information */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Payout Information</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="text-sm text-gray-500">
            <p className="mb-2">
              <strong>How payouts work:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Payouts are processed automatically after a payment is completed</li>
              <li>Platform fees are deducted from your earnings before payout</li>
              <li>Payouts are typically processed within 1-3 business days</li>
              <li>You can view the status of all your payouts on this page</li>
              <li>For any issues with payouts, please contact support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
