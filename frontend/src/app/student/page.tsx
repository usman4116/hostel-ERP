'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Shield, CreditCard, Calendar, ArrowRight, User, LogOut } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LeaveNoticeForm } from "@/components/student/LeaveNoticeForm";
import { StudentComplaintForm } from "@/components/student/StudentComplaintForm";
import { MessageSquare } from "lucide-react";

export default function StudentDashboard() {
  const { data: userProfile, isLoading: isUserLoading } = useQuery({ 
    queryKey: ['me'], 
    queryFn: () => api.get('/users/me/').then(res => res.data) 
  });

  const { data: vouchers = [] } = useQuery({ 
    queryKey: ['my-vouchers'], 
    queryFn: () => api.get('/vouchers/').then(res => res.data) 
  });

  const recentVouchers = vouchers.slice(0, 3);
  const pendingVouchers = vouchers.filter((v: any) => v.status !== 'Paid');

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your stay, rent, and activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsComplaintModalOpen(true)} variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
            <MessageSquare className="w-4 h-4 mr-2" />
            Lodge Complaint
          </Button>
          <Button onClick={() => setIsLeaveModalOpen(true)} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Submit Leave Notice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vouchers</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVouchers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Vouchers</CardTitle>
            <CardDescription>Your latest billing cycles</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVouchers.length > 0 ? (
              <div className="space-y-4">
                {recentVouchers.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">Voucher #{v.voucher_no}</p>
                      <p className="text-xs text-muted-foreground">Due: {v.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rs. {v.total_amount}</p>
                      <p className={`text-xs font-medium ${v.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {v.status}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/student/vouchers" className={cn(buttonVariants({ variant: "outline" }), "w-full mt-4")}>
                  View All Vouchers <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No vouchers generated yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {userProfile?.student_profile?.id && (
        <>
          <LeaveNoticeForm 
            open={isLeaveModalOpen} 
            onOpenChange={setIsLeaveModalOpen} 
            studentId={userProfile.student_profile.id} 
          />
          <StudentComplaintForm 
            open={isComplaintModalOpen} 
            onOpenChange={setIsComplaintModalOpen} 
            studentId={userProfile.student_profile.id} 
          />
        </>
      )}
    </div>
  );
}
