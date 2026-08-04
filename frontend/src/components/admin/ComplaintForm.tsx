import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const complaintSchema = z.object({
  student: z.any(),
  subject: z.string().min(1, "Subject is required"),
  msg: z.string().min(1, "Message is required"),
  status: z.string().default("Pending"),
  response: z.string().optional().or(z.literal("")),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint?: any;
}

export function ComplaintForm({ open, onOpenChange, complaint }: ComplaintFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!complaint;

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });

  const form = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      student: complaint?.student?.id || complaint?.student || 0,
      subject: complaint?.subject || "",
      msg: complaint?.msg || "",
      status: complaint?.status || "Pending",
      response: complaint?.response || "",
    },
  });

  useEffect(() => {
    if (complaint) {
      form.reset({
        student: complaint.student?.id || complaint.student || 0,
        subject: complaint.subject || "",
        msg: complaint.msg || "",
        status: complaint.status || "Pending",
        response: complaint.response || "",
      });
    } else {
      form.reset({
        student: 0,
        subject: "",
        msg: "",
        status: "Pending",
        response: "",
      });
    }
  }, [complaint, form]);

  const mutation = useMutation({
    mutationFn: (data: ComplaintFormValues) => {
      return isEditing ? api.put(`/complaints/${complaint.id}/`, data) : api.post('/complaints/', data);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Complaint updated!" : "Complaint logged!");
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save complaint.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Complaint" : "Log Complaint"}</DialogTitle>
          <DialogDescription>Record and respond to student complaints.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.room_no || 'No Room'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Broken Fan" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="msg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint Details</FormLabel>
                  <FormControl><Textarea {...field} className="h-24" placeholder="Describe the issue..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="response"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Response</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Response to the student..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Update Complaint" : "Log Complaint"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
