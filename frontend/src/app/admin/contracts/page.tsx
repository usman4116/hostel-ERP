'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSignature, Search, CheckCircle, Clock, Plus, Trash, Edit } from "lucide-react";
import { ContractForm } from "@/components/admin/ContractForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({ 
    queryKey: ['contracts'], 
    queryFn: () => api.get('/contracts/').then(res => res.data) 
  });

  const filtered = contracts.filter((c: any) => 
    c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.student_enrollment_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/contracts/${id}/`),
    onSuccess: () => {
      toast.success("Contract deleted!");
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    }
  });

  const handleEdit = (contract: any) => {
    if (contract.is_signed) {
      toast.error("Cannot edit a signed contract.");
      return;
    }
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Contracts</h2>
          <p className="text-muted-foreground mt-1">View the digital accommodation agreements and their signature statuses.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Contract
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              Contract Records
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student name or ID..."
                className="pl-9 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>CNIC / B-Form</TableHead>
                  <TableHead>Issued On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading contracts...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No contracts found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="font-medium">{contract.student_name}</div>
                        <div className="text-xs text-muted-foreground">{contract.student_enrollment_no}</div>
                      </TableCell>
                      <TableCell>{contract.student_cnic || 'N/A'}</TableCell>
                      <TableCell>{new Date(contract.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {contract.is_signed ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 gap-1 flex w-fit items-center">
                            <CheckCircle className="w-3 h-3" /> Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/50 gap-1 flex w-fit items-center">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {contract.is_signed ? (
                          <div className="text-sm">
                            <div>{new Date(contract.signed_at).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">By: {contract.signature_text}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(contract)}
                            disabled={contract.is_signed}
                            title={contract.is_signed ? "Cannot edit signed contract" : "Edit contract text"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => {
                              if(window.confirm('Are you sure you want to delete this contract?')) {
                                deleteMutation.mutate(contract.id);
                              }
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ContractForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        contract={editingContract}
      />
    </div>
  );
}
