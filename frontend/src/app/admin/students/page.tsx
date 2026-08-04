'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, FileText, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { StudentForm } from "@/components/admin/StudentForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Edit, Trash } from "lucide-react";

export default function AdminStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [], isLoading } = useQuery({ 
    queryKey: ['students'], 
    queryFn: () => api.get('/students/').then(res => res.data) 
  });

  const filteredStudents = students.filter((s: any) => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.enrollment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(s.room_no)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}/`),
    onSuccess: () => {
      toast.success("Student deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Directory</h2>
          <p className="text-muted-foreground mt-1">Manage hostel residents, their records, and statuses.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <StudentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        student={editingStudent} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>A complete list of registered students.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, ID, or room..."
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
                  <TableHead className="w-[100px]">Enrollment</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rent Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-xs text-muted-foreground">
                        {student.enrollment_no || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {student.room_no || 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{student.phone}</TableCell>
                      <TableCell>
                        {student.rent_status ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex w-fit items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Cleared
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 flex w-fit items-center gap-1">
                            <XCircle className="w-3 h-3" /> Due
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 text-primary">
                              <FileText className="w-4 h-4" /> Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(student.id)} className="text-red-500 focus:text-red-500">
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
