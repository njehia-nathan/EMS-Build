"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReleaseTicket from "./ReleaseTicket";
import { toast } from "sonner";

function PurchaseTicket({ eventId }: { eventId: Id<"events"> }) {
    const router = useRouter();
    const { user } = useUser();
    const queuePosition = useQuery(api.waitingList.getQueuePosition, {
        eventId,
        userId: user?.id ?? "",
    });

    const [timeRemaining, setTimeRemaining] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const offerExpiresAt = queuePosition?.offerExpiresAt ?? 0;
    const isExpired = Date.now() >= offerExpiresAt;

    const purchaseTicket = useMutation(api.tickets.purchaseTicket);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            if (isExpired) {
                setTimeRemaining("Expired");
                return;
            }

            const diff = offerExpiresAt - Date.now();
            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);

            if (minutes > 0) {
                setTimeRemaining(
                    `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${
                        seconds === 1 ? "" : "s"
                    }`
                );
            } else {
                setTimeRemaining(`${seconds} second${seconds === 1 ? "" : "s"}`);
            }
        };

        calculateTimeRemaining();

        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [offerExpiresAt, isExpired]);

    // Create Paystack Checkout
    const handlePurchase = async () => {
        if (!user || !queuePosition || queuePosition.status !== "offered") {
            return;
        }

        try {
            setIsLoading(true);
            const result = await purchaseTicket({
                eventId,
                userId: user.id,
                waitingListId: queuePosition._id,
            });

            if (result.success) {
                toast.success("Success!", {
                    description: "Your ticket has been purchased successfully!",
                });
                router.refresh();
            }
        } catch (error) {
            console.error("Error purchasing ticket:", error);
            toast.error("Failed to purchase ticket", {
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200">
            <div className="space-y-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Ticket Reserved
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Expires in {timeRemaining}
                                </p>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 leading-relaxed">
                            A ticket has been reserved for you. Complete your purchase before
                            the timer expires to secure your spot at this event.
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePurchase}
                    disabled={isExpired || isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-lg font-bold shadow-md
                    hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200
                    disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
                >
                    {isLoading
                        ? "Processing purchase..."
                        : "Purchase Your Ticket Now →"}
                </button>

                <div className="mt-4">
                    {queuePosition && (
                        <ReleaseTicket eventId={eventId} waitingListId={queuePosition._id} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default PurchaseTicket;