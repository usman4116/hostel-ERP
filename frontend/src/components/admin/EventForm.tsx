import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  event_type: z.enum(['Rent Due', 'Agreement Expiry', 'Check-in', 'Check-out', 'Complaint Follow-up', 'Maintenance', 'Visitor']),
  event_date: z.string().min(1, "Event date is required"),
  student: z.string().optional(),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
}

export function EventForm({ open, onOpenChange, event }: EventFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const { data: students = [] } = useQuery({ 
    queryKey: ['students'], 
    queryFn: () => api.get('/students/').then(res => res.data) 
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: event?.title || "",
      event_type: event?.event_type || "Rent Due",
      event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      student: event?.student ? String(event.student) : "",
      description: event?.description || "",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        event_type: event.event_type || "Rent Due",
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        student: event.student ? String(event.student) : "",
        description: event.description || "",
      });
    } else {
      form.reset({
        title: "",
        event_type: "Rent Due",
        event_date: new Date().toISOString().slice(0, 16),
        student: "",
        description: "",
      });
    }
  }, [event, form]);

  const mutation = useMutation({
    mutationFn: (data: EventFormValues) => {
      // If student is empty string, make it null for django foreign key
      const payload = { ...data, student: data.student || null };
      return isEditing ? api.put(`/calendar/${event.id}/`, payload) : api.post('/calendar/', payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Event updated successfully!" : "Event created successfully!");
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save event.");
      console.error(error);
    }
  });

  const onSubmit = (data: EventFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Add Calendar Event"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update details for this scheduled event." : "Schedule a new event or reminder."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Plumbing Maintenance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rent Due">Rent Due Date</SelectItem>
                        <SelectItem value="Agreement Expiry">Agreement Expiry</SelectItem>
                        <SelectItem value="Check-in">Student Check-in</SelectItem>
                        <SelectItem value="Check-out">Student Check-out</SelectItem>
                        <SelectItem value="Complaint Follow-up">Complaint Follow-up</SelectItem>
                        <SelectItem value="Maintenance">Maintenance Schedule</SelectItem>
                        <SelectItem value="Visitor">Visitor Appointment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Student (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None (General Event)</SelectItem>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} ({s.enrollment_no})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional details here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
