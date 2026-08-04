import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const roomSchema = z.object({
  building_name: z.string().min(1, "Building name is required"),
  floor: z.coerce.number().min(0, "Floor must be 0 or higher"),
  room_number: z.string().min(1, "Room number is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  occupancy_status: z.enum(["Vacant", "Occupied", "Maintenance"]),
  monthly_rent: z.coerce.number().min(0, "Rent must be positive"),
  security_deposit: z.coerce.number().min(0, "Deposit must be positive"),
  has_ac: z.boolean().default(false),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: any; // If provided, we are editing
}

export function RoomForm({ open, onOpenChange, room }: RoomFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!room;

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      building_name: room?.building_name || "Main Block",
      floor: room?.floor || 1,
      room_number: room?.room_number || "",
      capacity: room?.capacity || 2,
      occupancy_status: room?.occupancy_status || "Vacant",
      monthly_rent: room?.monthly_rent || 3000,
      security_deposit: room?.security_deposit || 5000,
      has_ac: room?.has_ac || false,
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        building_name: room.building_name,
        floor: room.floor,
        room_number: room.room_number,
        capacity: room.capacity,
        occupancy_status: room.occupancy_status,
        monthly_rent: room.monthly_rent,
        security_deposit: room.security_deposit,
        has_ac: room.has_ac,
      });
    } else {
      form.reset({
        building_name: "Main Block",
        floor: 1,
        room_number: "",
        capacity: 2,
        occupancy_status: "Vacant",
        monthly_rent: 3000,
        security_deposit: 5000,
        has_ac: false,
      });
    }
  }, [room, form]);

  const mutation = useMutation({
    mutationFn: (data: RoomFormValues) => 
      isEditing ? api.put(`/rooms/${room.id}/`, data) : api.post('/rooms/', data),
    onSuccess: () => {
      toast.success(isEditing ? "Room updated successfully!" : "Room created successfully!");
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to save room.");
      console.error(error);
    }
  });

  const onSubmit = (data: RoomFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room" : "Add New Room"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update details for this room." : "Fill in the details to register a new hostel room."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="building_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="occupancy_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupancy Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Vacant">Vacant</SelectItem>
                      <SelectItem value="Occupied">Occupied</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="security_deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="has_ac"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/20">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Air Conditioning
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This room has an AC unit installed.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Add Room"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
