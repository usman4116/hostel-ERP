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

const depositSchema = z.object({
  student: z.coerce.number().min(1, "Student is required"),
  deposit_received: z.coerce.number().min(0, "Deposit received must be >= 0"),
  damage_deduction: z.coerce.number().min(0).default(0),
  refund_amount: z.coerce.number().min(0).default(5000),
  status: z.string().default("Held"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface SecurityDepositFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit?: any;
}

export function SecurityDepositForm({ open, onOpenChange, deposit }: SecurityDepositFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!deposit;

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema) as any,
    defaultValues: {
      student: deposit?.student?.id || deposit?.student || 0,
      deposit_received: deposit?.deposit_received || 5000,
      damage_deduction: deposit?.damage_deduction || 0,
      refund_amount: deposit?.refund_amount || 5000,
      status: deposit?.status || "Held",
    },
  });

  useEffect(() => {
    if (deposit) {
      form.reset({
        student: deposit.student?.id || deposit.student || 0,
        deposit_received: deposit.deposit_received || 5000,
        damage_deduction: deposit.damage_deduction || 0,
        refund_amount: deposit.refund_amount || 5000,
        status: deposit.status || "Held",
      });
    } else {
      form.reset({
        student: 0,
        deposit_received: 5000,
        damage_deduction: 0,
        refund_amount: 5000,
        status: "Held",
      });
    }
  }, [deposit, form]);

  const mutation = useMutation({
    mutationFn: (data: DepositFormValues) => {
      return isEditing ? api.put(`/security-deposits/${deposit.id}/`, data) : api.post('/security-deposits/', data);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Security deposit updated!" : "Security deposit logged!");
      queryClient.invalidateQueries({ queryKey: ['security-deposits'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save security deposit. Ensure student doesn't already have one.");
    }
  });

  // Auto calculate refund amount
  const depositReceived = form.watch("deposit_received");
  const damageDeduction = form.watch("damage_deduction");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Security Deposit" : "Add Security Deposit"}</DialogTitle>
          <DialogDescription>Record student deposit and track deductions for damages.</DialogDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deposit_received"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Received</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => {
                        field.onChange(e);
                        form.setValue("refund_amount", Number(e.target.value) - Number(damageDeduction));
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="damage_deduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Damage Deduction</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => {
                        field.onChange(e);
                        form.setValue("refund_amount", Number(depositReceived) - Number(e.target.value));
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="refund_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Amount (PKR)</FormLabel>
                    <FormControl><Input type="number" {...field} readOnly className="bg-muted" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Held">Held</SelectItem>
                        <SelectItem value="Partially Refunded">Partially Refunded</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Record Deposit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
