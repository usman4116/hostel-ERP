import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";

const voucherSchema = z.object({
  student: z.string().min(1, "Student is required"),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
  billing_cycle_start: z.string().min(1, "Billing cycle start date is required"),
  billing_cycle_end: z.string().min(1, "Billing cycle end date is required"),
  due_date: z.string().min(1, "Due date is required"),
  rent_amount: z.coerce.number().min(0, "Amount must be positive"),
  electricity_charges: z.coerce.number().min(0, "Amount must be positive"),
  other_charges: z.coerce.number().min(0, "Amount must be positive"),
  initial_meter_reading: z.coerce.number().optional().nullable(),
  final_meter_reading: z.coerce.number().optional().nullable(),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher?: any;
}

export function VoucherForm({ open, onOpenChange, voucher }: VoucherFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!voucher;

  // Fetch students for dropdown
  const { data: students = [] } = useQuery({ 
    queryKey: ['students'], 
    queryFn: () => api.get('/students/').then(res => res.data) 
  });

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      student: "",
      enrollment_date: new Date().toISOString().split('T')[0],
      billing_cycle_start: "",
      billing_cycle_end: "",
      due_date: "",
      rent_amount: 3000,
      electricity_charges: 0,
      other_charges: 0,
    },
  });

  useEffect(() => {
    if (voucher) {
      form.reset({
        student: String(voucher.student),
        enrollment_date: voucher.enrollment_date,
        billing_cycle_start: voucher.billing_cycle_start,
        billing_cycle_end: voucher.billing_cycle_end,
        due_date: voucher.due_date,
        rent_amount: voucher.rent_amount,
        electricity_charges: voucher.electricity_charges,
        other_charges: voucher.other_charges,
        initial_meter_reading: voucher.initial_meter_reading,
        final_meter_reading: voucher.final_meter_reading,
      });
    } else {
      form.reset({
        student: "",
        enrollment_date: new Date().toISOString().split('T')[0],
        billing_cycle_start: "",
        billing_cycle_end: "",
        due_date: "",
        rent_amount: 3000,
        electricity_charges: 0,
        other_charges: 0,
        initial_meter_reading: null,
        final_meter_reading: null,
      });
    }
  }, [voucher, form]);

  const mutation = useMutation({
    mutationFn: (data: VoucherFormValues) => 
      isEditing ? api.put(`/vouchers/${voucher.id}/`, data) : api.post('/vouchers/', data),
    onSuccess: () => {
      toast.success(isEditing ? "Voucher updated successfully!" : "Voucher generated successfully!");
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to generate voucher. Please check the inputs.");
      console.error(error);
    }
  });

  const onSubmit = (data: VoucherFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rent Voucher" : "Generate Rent Voucher"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the billing details for this rent voucher." : "Fill in the billing details to generate a new rent voucher for a student."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_cycle_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_cycle_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing End</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="enrollment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="electricity_charges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electricity {voucher?.is_ac_room && "(Calculated)"}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other_charges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {voucher?.is_ac_room && (
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border border-border">
                <div className="col-span-2 text-sm font-medium mb-1 flex justify-between items-center">
                  <span>AC Meter Readings</span>
                  <span className="text-xs text-muted-foreground">Rate: {voucher.ac_unit_rate} PKR/unit</span>
                </div>
                <FormField
                  control={form.control}
                  name="initial_meter_reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Initial Reading</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} disabled className="bg-muted" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="final_meter_reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Final Reading</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto calculate preview
                            const final = parseFloat(e.target.value);
                            const initial = form.getValues('initial_meter_reading');
                            if (!isNaN(final) && initial != null && final >= initial) {
                              const units = final - initial;
                              // Approximate calculation (backend will do actual)
                              form.setValue('electricity_charges', units * (voucher.ac_unit_rate || 0));
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Generate Voucher"}
            </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
