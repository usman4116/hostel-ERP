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

const inspectionSchema = z.object({
  student: z.coerce.number().min(1, "Student is required"),
  room_number: z.string().min(1, "Room number is required"),
  inspection_type: z.string().min(1, "Type is required"),
  furniture_condition: z.string().default("Good"),
  wall_condition: z.string().default("Good"),
  electrical_condition: z.string().default("Good"),
  bathroom_condition: z.string().default("Good"),
  inventory_checklist: z.string().default("Bed, Desk, Chair, Fan, Light"),
  damage_notes: z.string().optional().or(z.literal("")),
  damage_charges: z.coerce.number().min(0).default(0),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: any;
}

export function InspectionForm({ open, onOpenChange, inspection }: InspectionFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!inspection;

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema) as any,
    defaultValues: {
      student: inspection?.student?.id || inspection?.student || 0,
      room_number: inspection?.room_number || "",
      inspection_type: inspection?.inspection_type || "Check-in",
      furniture_condition: inspection?.furniture_condition || "Good",
      wall_condition: inspection?.wall_condition || "Good",
      electrical_condition: inspection?.electrical_condition || "Good",
      bathroom_condition: inspection?.bathroom_condition || "Good",
      inventory_checklist: inspection?.inventory_checklist || "Bed, Desk, Chair, Fan, Light",
      damage_notes: inspection?.damage_notes || "",
      damage_charges: inspection?.damage_charges || 0,
    },
  });

  useEffect(() => {
    if (inspection) {
      form.reset({
        student: inspection.student?.id || inspection.student || 0,
        room_number: inspection.room_number || "",
        inspection_type: inspection.inspection_type || "Check-in",
        furniture_condition: inspection.furniture_condition || "Good",
        wall_condition: inspection.wall_condition || "Good",
        electrical_condition: inspection.electrical_condition || "Good",
        bathroom_condition: inspection.bathroom_condition || "Good",
        inventory_checklist: inspection.inventory_checklist || "Bed, Desk, Chair, Fan, Light",
        damage_notes: inspection.damage_notes || "",
        damage_charges: inspection.damage_charges || 0,
      });
    } else {
      form.reset({
        student: 0,
        room_number: "",
        inspection_type: "Check-in",
        furniture_condition: "Good",
        wall_condition: "Good",
        electrical_condition: "Good",
        bathroom_condition: "Good",
        inventory_checklist: "Bed, Desk, Chair, Fan, Light",
        damage_notes: "",
        damage_charges: 0,
      });
    }
  }, [inspection, form]);

  const mutation = useMutation({
    mutationFn: (data: InspectionFormValues) => {
      return isEditing ? api.put(`/inspections/${inspection.id}/`, data) : api.post('/inspections/', data);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Inspection updated!" : "Inspection recorded!");
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save inspection.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Inspection" : "New Room Inspection"}</DialogTitle>
          <DialogDescription>Record room condition for a student check-in or check-out.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
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
                name="room_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. 101" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inspection_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Check-in">Check-in Inspection</SelectItem>
                      <SelectItem value="Check-out">Check-out Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="furniture_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Furniture Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wall_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wall Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="electrical_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electrical Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathroom_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathroom Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inventory_checklist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Checklist</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="damage_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Damage Notes (if any)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="damage_charges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Damage Charges (PKR)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Inspection
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
