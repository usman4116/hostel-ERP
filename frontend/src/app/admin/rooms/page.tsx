'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, Trash, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RoomForm } from "@/components/admin/RoomForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminRoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({ 
    queryKey: ['rooms'], 
    queryFn: () => api.get('/rooms/').then(res => res.data) 
  });

  const filtered = rooms.filter((r: any) => 
    r.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.building_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/rooms/${id}/`),
    onSuccess: () => {
      toast.success("Room deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: () => toast.error("Failed to delete room.")
  });

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hostel Rooms</h2>
          <p className="text-muted-foreground mt-1">Manage rooms, capacities, and occupancy status.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      <RoomForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        room={editingRoom} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Rooms</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by room or building..."
                className="pl-9 bg-muted/50 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Building & Floor</TableHead>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Rent (PKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No rooms found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((room: any) => (
                    <TableRow key={room.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium">{room.building_name}</div>
                        <div className="text-xs text-muted-foreground">Floor {room.floor}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {room.room_number}
                          {room.has_ac && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] px-1.5 py-0">
                              AC
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{room.capacity} beds</TableCell>
                      <TableCell>{room.monthly_rent}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={room.occupancy_status === 'Occupied' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                        >
                          {room.occupancy_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(room)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Room
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(room.id)} className="text-red-500 focus:text-red-500">
                              <Trash className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
