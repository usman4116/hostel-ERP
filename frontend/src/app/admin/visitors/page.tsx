'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Plus, Edit, Trash, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VisitorForm } from "@/components/admin/VisitorForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminVisitorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: visitors = [], isLoading } = useQuery({ 
    queryKey: ['visitors'], 
    queryFn: () => api.get('/visitors/').then(res => res.data) 
  });

  const filtered = visitors.filter((v: any) => 
    v.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(v.student)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/visitors/${id}/`),
    onSuccess: () => {
      toast.success("Visitor deleted!");
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    }
  });

  const markOutMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/visitors/${id}/`, { check_out: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("Visitor marked out!");
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    }
  });

  const handleEdit = (visitor: any) => {
    setEditingVisitor(visitor);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingVisitor(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visitors Log</h2>
          <p className="text-muted-foreground mt-1">Track guest check-ins and student visitations.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Log Visitor
        </Button>
      </div>

      <VisitorForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        visitor={editingVisitor} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Visitors</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search visitor or student..."
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
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Visiting Student</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No visitors found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((visitor: any) => (
                    <TableRow key={visitor.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {new Date(visitor.check_in).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{visitor.visitor_name}</TableCell>
                      <TableCell>{visitor.phone}</TableCell>
                      <TableCell className="font-medium">{visitor.student_name} ({visitor.student_enrollment_no})</TableCell>
                      <TableCell className="text-muted-foreground">{visitor.purpose}</TableCell>
                      <TableCell>
                        {visitor.check_out ? new Date(visitor.check_out).toLocaleString() : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => markOutMutation.mutate(visitor.id)}
                            disabled={markOutMutation.isPending}
                          >
                            Mark Out
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(visitor)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(visitor.id)} className="text-red-500 focus:text-red-500">
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
