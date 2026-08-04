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
import { Loader2, AlertCircle } from "lucide-react";

const leaveNoticeSchema = z.object({
  planned_leaving_date: z.string().min(1, "Date is required"),
  reason: z.string().optional(),
});

type LeaveNoticeFormValues = z.infer<typeof leaveNoticeSchema>;

interface LeaveNoticeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
}

export function LeaveNoticeForm({ open, onOpenChange, studentId }: LeaveNoticeFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<LeaveNoticeFormValues>({
    resolver: zodResolver(leaveNoticeSchema),
    defaultValues: {
      planned_leaving_date: "",
      reason: "",
    },
  });

  const watchDate = form.watch("planned_leaving_date");
  const isEligible = watchDate 
    ? (new Date(watchDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24) >= 29.5 
    : false;

  const mutation = useMutation({
    mutationFn: (data: LeaveNoticeFormValues) => api.post('/leave-notices/', { ...data, student: studentId }),
    onSuccess: () => {
      toast.success("Leave Notice submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ['leave-notices'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to submit leave notice.");
    }
  });

  const onSubmit = (data: LeaveNoticeFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Leave Notice</DialogTitle>
          <DialogDescription>
            Provide your planned departure date. A 30-day notice is required for security deposit refunds.
          </DialogDescription>
        </DialogHeader>
        
        {watchDate && (
          <div className={`p-3 rounded-md flex items-start gap-2 ${isEligible ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              {isEligible 
                ? "Your notice is >= 30 days. You will be eligible for a security deposit refund (subject to inspection)."
                : "Your notice is less than 30 days. You will forfeit your security deposit."}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="planned_leaving_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Leaving Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for leaving (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Tell us why you're leaving..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Notice
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
