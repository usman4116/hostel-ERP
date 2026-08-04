'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, Download, Trash, Check, Printer, RefreshCw, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoucherForm } from "@/components/admin/VoucherForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminVouchersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  
  const [isAcRateOpen, setIsAcRateOpen] = useState(false);
  const [acRate, setAcRate] = useState("0.00");
  
  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({ 
    queryKey: ['vouchers'], 
    queryFn: () => api.get('/vouchers/').then(res => res.data) 
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/company-settings/').then(res => res.data)
  });

  const filtered = vouchers.filter((v: any) => {
    const matchesSearch = v.voucher_no?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === "ac") return v.is_ac_room === true;
    if (filterType === "non-ac") return v.is_ac_room === false;
    return true;
  });

  const updateAcRateMutation = useMutation({
    mutationFn: (rate: string) => {
      const id = settings.length > 0 ? settings[0].id : 1;
      return api.patch(`/company-settings/${id}/`, { ac_unit_rate: rate });
    },
    onSuccess: () => {
      toast.success("AC Unit Rate updated!");
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsAcRateOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/vouchers/${id}/`, { status }),
    onSuccess: () => {
      toast.success("Voucher status updated!");
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vouchers/${id}/`),
    onSuccess: () => {
      toast.success("Voucher deleted!");
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    }
  });

  const generateBatchMutation = useMutation({
    mutationFn: () => api.post(`/vouchers/generate_batch/`),
    onSuccess: (res) => {
      if (res.data.count > 0) {
        toast.success(`Generated ${res.data.count} new vouchers for this month!`);
      } else {
        toast.info("No new vouchers needed. All active students already have a voucher for this month.");
      }
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
    onError: () => {
      toast.error("Failed to generate batch vouchers.");
    }
  });

  const handleDownloadPDF = async (voucher: any) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-toast" });
      const response = await api.get(`/vouchers/${voucher.id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `voucher_${voucher.voucher_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF Downloaded", { id: "pdf-toast" });
    } catch (error) {
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    }
  };

  const handleEdit = (voucher: any) => {
    setEditingVoucher(voucher);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingVoucher(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vouchers</h2>
          <p className="text-muted-foreground mt-1">Manage rent vouchers, fee collections, and payments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => {
              if (settings.length > 0) {
                setAcRate(settings[0].ac_unit_rate || "0.00");
              }
              setIsAcRateOpen(true);
            }} 
            variant="outline" 
            className="rounded-full px-4 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
          >
            AC Unit Rate
          </Button>
          <Button 
            onClick={() => generateBatchMutation.mutate()} 
            disabled={generateBatchMutation.isPending}
            variant="outline" 
            className="rounded-full px-4"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generateBatchMutation.isPending ? 'animate-spin' : ''}`} />
            Auto-Generate For All
          </Button>
          <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
            <Plus className="w-4 h-4 mr-2" />
            Manual Voucher
          </Button>
        </div>
      </div>
      
      <Dialog open={isAcRateOpen} onOpenChange={setIsAcRateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set AC Unit Rate</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Price per Unit (PKR)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={acRate} 
              onChange={(e) => setAcRate(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcRateOpen(false)}>Cancel</Button>
            <Button onClick={() => updateAcRateMutation.mutate(acRate)} disabled={updateAcRateMutation.isPending}>Save Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <VoucherForm open={isFormOpen} onOpenChange={setIsFormOpen} voucher={editingVoucher} />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Vouchers</CardTitle>
            </div>
            <div className="flex gap-4 items-center">
              <Tabs value={filterType} onValueChange={setFilterType}>
                <TabsList className="bg-muted/50 rounded-full h-9">
                  <TabsTrigger value="all" className="rounded-full text-xs">All Vouchers</TabsTrigger>
                  <TabsTrigger value="ac" className="rounded-full text-xs">AC Rooms</TabsTrigger>
                  <TabsTrigger value="non-ac" className="rounded-full text-xs">Non-AC</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search voucher # or student..."
                  className="pl-9 bg-muted/50 rounded-full h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total (PKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No vouchers found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((voucher: any) => (
                    <TableRow key={voucher.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-primary">{voucher.voucher_no}</TableCell>
                      <TableCell>{voucher.student_name} ({voucher.student_enrollment_no}) | Room: {voucher.student_room_no}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {voucher.billing_cycle_start} to {voucher.billing_cycle_end}
                      </TableCell>
                      <TableCell>{voucher.due_date}</TableCell>
                      <TableCell className="font-medium">{voucher.total_amount}</TableCell>
                      <TableCell>
                        <Select 
                          value={voucher.status} 
                          onValueChange={(val) => updateStatusMutation.mutate({ id: voucher.id, status: val })}
                        >
                          <SelectTrigger className={`w-[110px] h-8 text-xs ${
                            voucher.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            voucher.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          }`}>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(voucher)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Voucher
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2" onClick={() => window.print()}>
                              <Printer className="w-4 h-4" /> Print (Browser)
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleDownloadPDF(voucher)}>
                              <Download className="w-4 h-4" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(voucher.id)} className="text-red-500 focus:text-red-500">
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
