"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const complaintSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  msg: z.string().min(1, "Message is required"),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface StudentComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
}

export function StudentComplaintForm({ open, onOpenChange, studentId }: StudentComplaintFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema) as any,
    defaultValues: {
      subject: "",
      msg: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ComplaintFormValues) => api.post('/complaints/', { ...data, student: studentId, status: "Pending" }),
    onSuccess: () => {
      toast.success("Complaint submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to submit complaint.");
    }
  });

  const onSubmit = (data: ComplaintFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Complaint</DialogTitle>
          <DialogDescription>
            Detail your issue below. Management will review it shortly.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Plumbing issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="msg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message / Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the issue in detail..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Complaint
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
