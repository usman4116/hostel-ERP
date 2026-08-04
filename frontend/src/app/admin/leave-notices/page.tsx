'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, FileSignature } from "lucide-react";

export default function LeaveNoticesPage() {
  const queryClient = useQueryClient();
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['leave-notices'],
    queryFn: () => api.get('/leave-notices/').then(res => res.data)
  });

  const updateNoticeMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/leave-notices/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-notices'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Notices</h2>
          <p className="text-muted-foreground mt-1">Manage student hostel leave requests and refund eligibility.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Notices</CardTitle>
          <CardDescription>A list of all submitted leave notices</CardDescription>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No leave notices found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Notice Date</th>
                    <th className="px-4 py-3 font-medium">Leaving Date</th>
                    <th className="px-4 py-3 font-medium">Refund Eligible</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notices.map((notice: any) => (
                    <tr key={notice.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{notice.student_name}</p>
                        <p className="text-xs text-muted-foreground">{notice.student_enrollment_no}</p>
                      </td>
                      <td className="px-4 py-3">{notice.notice_date}</td>
                      <td className="px-4 py-3">{notice.planned_leaving_date}</td>
                      <td className="px-4 py-3">
                        {notice.eligible_for_refund ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notice.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          notice.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {notice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {notice.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => updateNoticeMutation.mutate({ id: notice.id, status: 'Approved' })} 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => updateNoticeMutation.mutate({ id: notice.id, status: 'Rejected' })} 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 w-8 p-0"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
