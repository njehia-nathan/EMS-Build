import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { clsx, type ClassValue } from "clsx"
import { useQuery } from "convex/react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useStorageUrl(storageId: Id<"_storage"> | undefined) {
  return useQuery(api.storage.getUrl, storageId ? { storageId } : "skip");
}

/**
 * Format a number as KES currency
 * @param amount The amount to format
 * @param inCents Whether the amount is in cents (default: false)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, inCents: boolean = false) {
  const value = inCents ? amount / 100 : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
