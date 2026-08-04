'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, CheckCircle, Clock, AlertCircle, Plus, Edit, Trash, MoreHorizontal, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DocumentForm } from "@/components/admin/DocumentForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery({ 
    queryKey: ['documents'], 
    queryFn: () => api.get('/documents/').then(res => res.data) 
  });

  const filtered = documents.filter((d: any) => 
    String(d.student)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.doc_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}/`),
    onSuccess: () => {
      toast.success("Document deleted!");
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number, status: string, reason?: string }) => 
      api.patch(`/documents/${id}/`, { verification_status: status, rejection_reason: reason || "" }),
    onSuccess: () => {
      toast.success("Document status updated!");
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Documents</h2>
          <p className="text-muted-foreground mt-1">Verify ID cards, agreements, and uploaded forms.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <DocumentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        document={editingDoc} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Queue</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student or doc type..."
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
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Verification</TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No documents found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc: any) => (
                    <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{doc.student_name} ({doc.student_enrollment_no}) | Room: {doc.student_room_no}</TableCell>
                      <TableCell>{doc.doc_type}</TableCell>
                      <TableCell>{doc.expiry_date || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            doc.verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                            doc.verification_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }
                        >
                          {doc.verification_status === 'Verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {doc.verification_status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          {doc.verification_status === 'Rejected' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {doc.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {doc.file && (
                              <DropdownMenuItem onClick={() => window.open(doc.file, '_blank')}>
                                <Eye className="w-4 h-4 mr-2" /> View Document
                              </DropdownMenuItem>
                            )}
                            {doc.verification_status !== 'Verified' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'Verified' })}>
                                <Check className="w-4 h-4 mr-2 text-emerald-500" /> Verify
                              </DropdownMenuItem>
                            )}
                            {doc.verification_status !== 'Rejected' && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: doc.id, status: 'Rejected', reason: 'Invalid document.' })}>
                                <X className="w-4 h-4 mr-2 text-red-500" /> Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(doc)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(doc.id)} className="text-red-500 focus:text-red-500">
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
