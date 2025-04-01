'use client';

import { useState } from "react";
import { DollarSign, Tag, Download, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  _id: string;
  amount: number;
  status: string;
  createdAt: number;
  eventName: string;
  userName: string;
  userEmail: string;
  platformFee?: number;
  sellerAmount?: number;
  payoutStatus?: string;
}

interface SellerSalesClientProps {
  payments: Payment[];
}

export default function SellerSalesClient({ payments }: SellerSalesClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Format currency
  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };
  
  // Apply filters
  const filteredPayments = payments.filter(payment => {
    // Status filter
    if (statusFilter !== 'all' && payment.status !== statusFilter) {
      return false;
    }
    
    // Time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;
      
      if (timeFilter === 'today' && payment.createdAt < now - oneDay) {
        return false;
      }
      if (timeFilter === 'week' && payment.createdAt < now - oneWeek) {
        return false;
      }
      if (timeFilter === 'month' && payment.createdAt < now - oneMonth) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort payments by date (newest first)
  const sortedPayments = [...filteredPayments].sort((a, b) => b.createdAt - a.createdAt);
  
  // Calculate totals
  const totalRevenue = sortedPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalFees = sortedPayments
    .filter(p => p.status === 'completed' && p.platformFee)
    .reduce((sum, p) => sum + (p.platformFee || 0), 0);
  
  const netRevenue = totalRevenue - totalFees;
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Event',
      'Customer',
      'Email',
      'Amount',
      'Platform Fee',
      'Net Amount',
      'Status',
      'Payout Status'
    ];
    
    const rows = sortedPayments.map(payment => [
      formatDate(payment.createdAt),
      payment.eventName,
      payment.userName,
      payment.userEmail,
      formatAmount(payment.amount),
      payment.platformFee ? formatAmount(payment.platformFee) : '-',
      payment.sellerAmount ? formatAmount(payment.sellerAmount) : formatAmount(payment.amount - (payment.platformFee || 0)),
      payment.status,
      payment.payoutStatus || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label htmlFor="time-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              id="time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Total Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(totalRevenue)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* Platform Fees */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Platform Fees</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(totalFees)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* Net Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Revenue</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatAmount(netRevenue)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Sales History</h3>
        </div>
        {sortedPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.platformFee ? formatAmount(payment.platformFee) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.sellerAmount 
                        ? formatAmount(payment.sellerAmount) 
                        : formatAmount(payment.amount - (payment.platformFee || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'refunded' ? 'bg-red-100 text-red-800' : 
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.payoutStatus ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${payment.payoutStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                            payment.payoutStatus === 'failed' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {payment.payoutStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No sales found</p>
          </div>
        )}
      </div>
    </div>
  );
}
