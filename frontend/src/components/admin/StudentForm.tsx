import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

const studentSchema = z.object({
  user: z.coerce.number().min(1, "User is required"),
  phone_no: z.string().min(1, "Phone number is required"),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().optional().or(z.literal("")),
  room_no: z.coerce.number().nullable().optional(),
  rent_price: z.coerce.number().min(0, "Rent price must be >= 0"),
  rent_status: z.boolean().default(false),
  assigned_warden: z.coerce.number().nullable().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
}

export function StudentForm({ open, onOpenChange, student }: StudentFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!student;
  const EMPTY_ARRAY: any[] = [];
  const { data: users = EMPTY_ARRAY } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users/').then(res => res.data) });
  const { data: rooms = EMPTY_ARRAY } = useQuery({ queryKey: ['rooms'], queryFn: () => api.get('/rooms/').then(res => res.data) });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      user: student?.user?.id || student?.user || 0,
      phone_no: student?.phone || "",
      dob: student?.dob || "",
      gender: student?.gender || "Male",
      address: student?.address || "",
      room_no: null, // this gets properly set in useEffect once rooms load
      rent_price: student?.rent_price || 0,
      rent_status: student?.rent_status || false,
      assigned_warden: student?.assigned_warden?.id || student?.assigned_warden || null,
    },
  });

  useEffect(() => {
    if (student) {
      const matchingRoom = rooms.find((r: any) => r.room_number === student.room_no);
      form.reset({
        user: student.user?.id || student.user || 0,
        phone_no: student.phone || "",
        dob: student.dob || "",
        gender: student.gender || "Male",
        address: student.address || "",
        room_no: matchingRoom ? matchingRoom.id : null,
        rent_price: student.rent_price || 0,
        rent_status: student.rent_status || false,
        assigned_warden: student.assigned_warden?.id || student.assigned_warden || null,
      });
    } else {
      form.reset({
        user: 0,
        phone_no: "",
        dob: "",
        gender: "Male",
        address: "",
        room_no: null,
        rent_price: 0,
        rent_status: false,
        assigned_warden: null,
      });
    }
  }, [student, form, rooms]);

  const mutation = useMutation({
    mutationFn: (data: StudentFormValues) => {
      const selectedUser = users.find((u: any) => u.id === data.user);
      const selectedRoom = rooms.find((r: any) => String(r.id) === String(data.room_no));
      
      const payload: any = { 
        ...data, 
        user_id: data.user,
        name: selectedUser?.first_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser?.username || 'Student',
        email: selectedUser?.email || `${selectedUser?.username}@example.com`,
        phone: data.phone_no,
      };
      
      if (selectedRoom) {
        payload.room_no = selectedRoom.room_number;
      } else {
        payload.room_no = "None"; // It is required by Django model
      }

      delete payload.user;
      delete payload.phone_no;
      
      if (!payload.assigned_warden) payload.assigned_warden = null;
      if (!payload.dob) delete payload.dob;
      
      return isEditing ? api.put(`/students/${student.id}/`, payload) : api.post('/students/', payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Student updated successfully!" : "Student created successfully!");
      queryClient.invalidateQueries({ queryKey: ['students'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save student.");
      console.error(error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update details for this student." : "Register a new student profile."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Account (must be created in Users first)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.username} ({u.email})</SelectItem>
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
                name="phone_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : "null"}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {rooms.map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.room_number} ({r.building_name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rent_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rent_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent Status</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === 'paid')} value={field.value ? 'paid' : 'unpaid'}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_warden"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Warden (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : "null"}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select warden" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>
                      {users.filter((u: any) => u.is_staff).map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Create Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
