'use client';

import { useState } from "react";
import Link from "next/link";
import { Calendar, DollarSign, Tag, Users, Clock, Edit, Trash, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Event {
  _id: string;
  name: string;
  location: string;
  eventDate: number;
  price: number;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  status: string;
  is_cancelled?: boolean;
  commissionRate?: number;
}

interface SellerEventListProps {
  events: Event[];
}

export default function SellerEventList({ events }: SellerEventListProps) {
  const [filter, setFilter] = useState('all');
  
  // Format currency
  const formatPrice = (price: number) => {
    return formatCurrency(price);
  };
  
  // Filter events based on status
  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.status === filter);
  
  // Sort events by date (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => b.eventDate - a.eventDate);
  
  return (
    <div>
      {/* Filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setFilter('all')}
            className={`${
              filter === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`${
              filter === 'active'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`${
              filter === 'ended'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`${
              filter === 'cancelled'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
          >
            Cancelled
          </button>
        </nav>
      </div>
      
      {/* Event list */}
      {sortedEvents.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {sortedEvents.map((event) => (
            <li key={event._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {event.name}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${event.status === 'active' ? 'bg-green-100 text-green-800' : 
                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {formatPrice(event.price)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p className="flex items-center">
                      <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {event.soldTickets} / {event.totalTickets} tickets sold
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <DollarSign className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      Revenue: {formatPrice(event.revenue)}
                    </p>
                    {event.commissionRate !== undefined && (
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        Commission: {event.commissionRate}%
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex space-x-2 sm:mt-0">
                    <Link
                      href={`/seller/events/${event._id}`}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <Link
                      href={`/seller/events/${event._id}/edit`}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found</p>
          <Link
            href="/seller/new-event"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create your first event
          </Link>
        </div>
      )}
    </div>
  );
}
