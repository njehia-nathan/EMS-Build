// components/admin/PaymentSummary.tsx
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, RefreshCw, AlertTriangle, CreditCard, DollarSign } from "lucide-react";

type PaymentStats = {
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  failedPayments: number;
  averageOrderValue: number;
  revenueByMethod: {
    method: string;
    amount: number;
    count: number;
  }[];
};

export default function PaymentSummary({ stats }: { stats: PaymentStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-green-100">
              <DollarSign className="h-6 w-6 text-green-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-semibold text-gray-900">KSh {stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Avg. KSh {stats.averageOrderValue.toLocaleString()} per order</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.completedPayments}</p>
              <p className="text-sm text-gray-500">of {stats.totalPayments} total payments</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-yellow-100">
              <AlertTriangle className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.pendingPayments}</p>
              <p className="text-sm text-gray-500">awaiting confirmation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-red-100">
              <RefreshCw className="h-6 w-6 text-red-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Refunded</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.refundedPayments}</p>
              <p className="text-sm text-gray-500">{stats.failedPayments} failed payments</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.revenueByMethod.map((method) => (
              <div key={method.method} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{method.method}</h4>
                </div>
                <p className="text-2xl font-semibold text-gray-900">KSh {method.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{method.count} transactions</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}