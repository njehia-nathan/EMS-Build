"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // ✅ Use Sonner for notifications
import { useStorageUrl } from "@/lib/utils";

// ✅ Define Form Schema
const formSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  eventDate: z
    .date()
    .min(new Date(new Date().setHours(0, 0, 0, 0)), "Event date must be in the future"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  totalTickets: z.coerce.number().min(1, "Must have at least 1 ticket"),
});

type FormData = z.infer<typeof formSchema>;

interface InitialEventData {
  eventId: Id<"events">; // ✅ Changed from `_id` to `eventId`
  name: string;
  description: string;
  location: string;
  eventDate: number;
  price: number;
  totalTickets: number;
  imageStorageId?: Id<"_storage">;
}

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: InitialEventData;
}

function EventForm({ mode, initialData }: EventFormProps) {
  const { user } = useUser();
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.updateEvent);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentImageUrl = useStorageUrl(initialData?.imageStorageId);

  // ✅ Image Upload
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateEventImage = useMutation(api.storage.updateEventImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  const [removedCurrentImage, setRemovedCurrentImage] = useState(false);

  // ✅ Initialize Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      location: initialData?.location ?? "",
      eventDate: initialData ? new Date(initialData.eventDate) : new Date(),
      price: initialData?.price ?? 0,
      totalTickets: initialData?.totalTickets ?? 1,
    },
  });

  // ✅ Handle Form Submission with Sonner Toaster
  async function onSubmit(values: FormData) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createEvent({
            ...values,
            userId: user?.id ?? "", // ✅ Ensures `userId` is always a string
            eventDate: values.eventDate.getTime(),
          });

          toast.success("Event Created!", {
            description: "Your event has been successfully created.",
          });
        } else {
          if (!initialData?.eventId) {
            toast.error("Error!", {
              description: "Event ID is missing. Cannot update.",
            });
            return;
          }

          await updateEvent({
            ...values,
            eventId: initialData?.eventId ?? "", 
            eventDate: values.eventDate.getTime(),
          });

          toast.success("Event Updated!", {
            description: "Your event has been successfully updated.",
          });
        }

        router.push("/events");
      } catch (error) {
        console.error("Error submitting event:", error);
        toast.error("Something went wrong!", {
          description: "Please try again later.",
        });
      }
    });
  }

  // ✅ Handle Image Upload
  async function handleImageUpload(file: File): Promise<string | null> {
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      toast.success("Image Uploaded!", {
        description: "The event image has been successfully uploaded.",
      });

      return storageId;
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Image Upload Failed!", {
        description: "Please try again.",
      });
      return null;
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form fields */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField
          control={form.control}
          name="location"
          render={({field}) =>(
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={(e) => {
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      );
                    }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Ticket</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-700">
                      Ksh.
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value);
                        field.onChange(value);
                      }}
                      className="pl-16"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalTickets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Tickets Available</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(value); 
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        {/*Image Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Event Image</label>
          <div className="mt-1 flex items-center gap-4">
            {imagePreview || (!removedCurrentImage && currentImageUrl) ? (
              <div className="relative w-32 aspect-square bg-gray-100 rounded-lg">
                <Image
                  src={imagePreview || currentImageUrl!}
                  alt="Preview"
                  fill
                  className="object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setRemovedCurrentImage(true);
                    if (imageInput.current) imageInput.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0]!)}
                ref={imageInput}
                className="block w-full text-sm text-gray-500 file:bg-blue-50 file:text-blue-700 file:rounded-full file:border-0 file:py-2 file:px-4 hover:file:bg-blue-100"
              />
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "create" ? "Creating Event..." : "Updating Event..."}
            </>
          ) : mode === "create" ? (
            "Create Event"
          ) : (
            "Update Event"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default EventForm;