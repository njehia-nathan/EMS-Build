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
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number) {
  // For KES, we don't divide by 100 as amounts are already in whole shillings
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
