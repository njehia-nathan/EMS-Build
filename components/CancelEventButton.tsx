"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CancelEventButton({
  eventId,
}: {
  eventId: Id<"events">;
}) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const cancelEvent = useMutation(api.events.cancelEvent);

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this event? All tickets will be refunded and the event will be cancelled permanently."
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      const promise = Promise.all([
        cancelEvent({ eventId }),
      ]);

      toast.promise(promise, {
        loading: "Processing cancellation...",
        success: () => {
          router.push("/seller/events");
          return "Event cancelled - All tickets have been refunded!";
        },
        error: "Failed to cancel event. Please try again.",
      });
    } catch (error) {
      console.error("Failed to cancel event:", error);
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isCancelling}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Ban className="w-4 h-4" />
      <span>{isCancelling ? "Processing..." : "Cancel Event"}</span>
    </button>
  );
}