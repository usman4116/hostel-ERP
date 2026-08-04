'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, History, Check, X } from "lucide-react";

export default function AdminRentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: history = [], isLoading } = useQuery({ 
    queryKey: ['rent-history'], 
    queryFn: () => api.get('/rent-history/').then(res => res.data) 
  });

  const filtered = history.filter((h: any) => 
    String(h.student)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.month?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rent Payment History</h2>
          <p className="text-muted-foreground mt-1">Audit log of all processed rent payments.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Log</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search student or month..."
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
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount Billed</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
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
                  filtered.map((record: any) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        {record.date_paid || 'Pending'}
                      </TableCell>
                      <TableCell className="font-medium">{record.student_name} ({record.student_enrollment_no})</TableCell>
                      <TableCell>{record.month}</TableCell>
                      <TableCell>Rs. {record.amount}</TableCell>
                      <TableCell className="font-bold text-emerald-600">Rs. {record.amount_paid}</TableCell>
                      <TableCell>
                        {record.status === 'paid' ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 flex w-fit items-center gap-1">
                            <Check className="w-3 h-3" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 flex w-fit items-center gap-1">
                            <X className="w-3 h-3" /> Unpaid
                          </Badge>
                        )}
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
