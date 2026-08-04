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
import { Loader2 } from "lucide-react";

const visitorSchema = z.object({
  visitor_name: z.string().min(1, "Name is required"),
  student: z.coerce.number().min(1, "Student is required"),
  phone: z.string().min(1, "Phone is required"),
  purpose: z.string().min(1, "Purpose is required"),
});

type VisitorFormValues = z.infer<typeof visitorSchema>;

interface VisitorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor?: any;
}

export function VisitorForm({ open, onOpenChange, visitor }: VisitorFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!visitor;

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema) as any,
    defaultValues: {
      visitor_name: visitor?.visitor_name || "",
      student: visitor?.student?.id || visitor?.student || 0,
      phone: visitor?.phone || "",
      purpose: visitor?.purpose || "",
    },
  });

  useEffect(() => {
    if (visitor) {
      form.reset({
        visitor_name: visitor.visitor_name || "",
        student: visitor.student?.id || visitor.student || 0,
        phone: visitor.phone || "",
        purpose: visitor.purpose || "",
      });
    } else {
      form.reset({
        visitor_name: "",
        student: 0,
        phone: "",
        purpose: "",
      });
    }
  }, [visitor, form]);

  const mutation = useMutation({
    mutationFn: (data: VisitorFormValues) => {
      return isEditing ? api.put(`/visitors/${visitor.id}/`, data) : api.post('/visitors/', data);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Visitor log updated!" : "Visitor logged in successfully!");
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to log visitor.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Visitor Log" : "Log New Visitor"}</DialogTitle>
          <DialogDescription>Record a new visitor entry for a student.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="visitor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visitor Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visiting Student</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Log Visitor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
