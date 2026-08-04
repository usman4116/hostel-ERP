'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, RefreshCw, Plus, Edit, Trash, MoreHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SecurityDepositForm } from "@/components/admin/SecurityDepositForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminDepositsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: deposits = [], isLoading } = useQuery({ 
    queryKey: ['security-deposits'], 
    queryFn: () => api.get('/security-deposits/').then(res => res.data) 
  });

  const filtered = deposits.filter((d: any) => 
    String(d.student)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/security-deposits/${id}/`),
    onSuccess: () => {
      toast.success("Deposit record deleted!");
      queryClient.invalidateQueries({ queryKey: ['security-deposits'] });
    }
  });

  const handleEdit = (deposit: any) => {
    setEditingDeposit(deposit);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingDeposit(null);
    setIsFormOpen(true);
  };

  const handleDownloadPDF = async (deposit: any) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-toast" });
      const response = await api.get(`/security-deposits/${deposit.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security_deposit_${deposit.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF Downloaded", { id: "pdf-toast" });
    } catch (error) {
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Deposits</h2>
          <p className="text-muted-foreground mt-1">Track student deposits, damage deductions, and refunds.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Log Deposit
        </Button>
      </div>

      <SecurityDepositForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        deposit={editingDeposit} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Deposits</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by student or status..."
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
                  <TableHead>Student</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Refund Due</TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No records found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((dep: any) => (
                    <TableRow key={dep.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        {dep.student_name} ({dep.student_enrollment_no})
                      </TableCell>
                      <TableCell>Rs. {dep.deposit_received}</TableCell>
                      <TableCell className="text-red-500">Rs. {dep.damage_deduction}</TableCell>
                      <TableCell className="font-bold">Rs. {dep.refund_amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            dep.status === 'Refunded' ? 'bg-emerald-100 text-emerald-700' :
                            dep.status === 'Partially Refunded' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }
                        >
                          {dep.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(dep)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit / Process Refund
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(dep)}>
                              <Download className="w-4 h-4 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(dep.id)} className="text-red-500 focus:text-red-500">
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
