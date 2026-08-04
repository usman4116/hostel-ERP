'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MessageSquare, Clock, CheckCircle, Plus, Edit, Trash, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ComplaintForm } from "@/components/admin/ComplaintForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminComplaintsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: complaints = [], isLoading } = useQuery({ 
    queryKey: ['complaints'], 
    queryFn: () => api.get('/complaints/').then(res => res.data) 
  });

  const filtered = complaints.filter((c: any) => 
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.msg?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/complaints/${id}/`),
    onSuccess: () => {
      toast.success("Complaint deleted!");
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }
  });

  const handleEdit = (complaint: any) => {
    setEditingComplaint(complaint);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingComplaint(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Complaints</h2>
          <p className="text-muted-foreground mt-1">Review and resolve student issues and feedback.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Log Complaint
        </Button>
      </div>

      <ComplaintForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        complaint={editingComplaint} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Complaints</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subject or message..."
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
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No complaints found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((complaint: any) => (
                    <TableRow key={complaint.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap">{complaint.date}</TableCell>
                      <TableCell className="font-medium">{complaint.student_name} ({complaint.student_enrollment_no})</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{complaint.subject}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">{complaint.msg}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }
                        >
                          {complaint.status === 'Resolved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(complaint)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(complaint.id)} className="text-red-500 focus:text-red-500">
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
