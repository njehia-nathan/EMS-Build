'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  Settings, 
  Users, 
  FileText,
  PlusCircle
} from "lucide-react";

export default function SellerSidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  const navItems = [
    { name: "Dashboard", href: "/seller", icon: Home },
    { name: "My Events", href: "/seller/events", icon: Calendar },
    { name: "Sales", href: "/seller/sales", icon: DollarSign },
    { name: "Payouts", href: "/seller/payouts", icon: FileText },
    { name: "Settings", href: "/seller/settings", icon: Settings },
  ];
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-white text-xl font-bold">Seller Dashboard</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive(item.href)
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        isActive(item.href) ? "text-gray-300" : "text-gray-400 group-hover:text-gray-300"
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <Link
              href="/seller/new-event"
              className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
