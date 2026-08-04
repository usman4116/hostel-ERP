'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InspectionForm } from "@/components/admin/InspectionForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, ClipboardCheck, Edit, Trash, MoreHorizontal } from "lucide-react";

export default function AdminInspectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: inspections = [], isLoading } = useQuery({ 
    queryKey: ['inspections'], 
    queryFn: () => api.get('/inspections/').then(res => res.data) 
  });

  const filtered = inspections.filter((i: any) => 
    String(i.student)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/inspections/${id}/`),
    onSuccess: () => {
      toast.success("Inspection log deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  });

  const handleEdit = (inspection: any) => {
    setEditingInspection(inspection);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingInspection(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Room Inspections</h2>
          <p className="text-muted-foreground mt-1">Manage check-in and check-out condition reports.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </Button>
      </div>

      <InspectionForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        inspection={editingInspection} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inspection Logs</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search room or student..."
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
                  <TableHead>Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Damage Charges</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No inspections found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inspection: any) => (
                    <TableRow key={inspection.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{inspection.room_number}</TableCell>
                      <TableCell className="font-medium">{inspection.student_name} ({inspection.student_enrollment_no})</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={inspection.inspection_type === 'Check-in' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}>
                          {inspection.inspection_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={Number(inspection.damage_charges) > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        Rs. {inspection.damage_charges}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(inspection)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(inspection.id)} className="text-red-500 focus:text-red-500">
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
