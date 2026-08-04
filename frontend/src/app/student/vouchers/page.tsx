'use client';

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";

export default function StudentVouchersPage() {
  const { data: vouchers = [], isLoading } = useQuery({ 
    queryKey: ['my-vouchers'], 
    queryFn: () => api.get('/vouchers/').then(res => res.data) 
  });

  const handleDownloadPDF = async (voucher: any) => {
    try {
      toast.loading("Downloading PDF...", { id: "pdf-toast" });
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Vouchers</h2>
        <p className="text-muted-foreground mt-1">View your billing history and download invoices.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total (PKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No vouchers generated for your account yet.</TableCell>
                  </TableRow>
                ) : (
                  vouchers.map((voucher: any) => (
                    <TableRow key={voucher.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-primary flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        {voucher.voucher_no}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {voucher.billing_cycle_start} to {voucher.billing_cycle_end}
                      </TableCell>
                      <TableCell>{voucher.due_date}</TableCell>
                      <TableCell className="font-medium">Rs. {voucher.total_amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={
                            voucher.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                            voucher.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }
                        >
                          {voucher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button onClick={() => handleDownloadPDF(voucher)} variant="outline" size="sm" className="gap-2">
                           <Download className="w-4 h-4" /> PDF
                         </Button>
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
