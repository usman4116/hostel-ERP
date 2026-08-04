'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, AlertCircle, CreditCard, Activity, MessageSquare, Clock, LogOut, Check, X } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => api.get('/rooms/').then(res => res.data) });
  const { data: vouchers = [] } = useQuery({ queryKey: ['vouchers'], queryFn: () => api.get('/vouchers/').then(res => res.data) });
  const { data: complaints = [] } = useQuery({ queryKey: ['complaints'], queryFn: () => api.get('/complaints/').then(res => res.data) });
  const { data: leaveNotices = [] } = useQuery({ queryKey: ['leave-notices'], queryFn: () => api.get('/leave-notices/').then(res => res.data) });

  const queryClient = useQueryClient();

  const updateNoticeMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.patch(`/leave-notices/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-notices'] });
    }
  });

  // Calculate metrics
  const totalStudents = students.length;
  const occupiedRooms = rooms.filter((r: any) => r.occupancy_status === 'Occupied').length;
  const pendingComplaints = complaints.filter((c: any) => c.status === 'Pending').length;
  const totalRevenue = vouchers.filter((v: any) => v.status === 'Paid').reduce((acc: number, v: any) => acc + Number(v.total_amount || 0), 0);
  const pendingDues = vouchers.filter((v: any) => v.status === 'Unpaid' || v.status === 'Overdue').reduce((acc: number, v: any) => acc + Number(v.total_amount || 0), 0);
  const pendingLeaveNotices = leaveNotices.filter((n: any) => n.status === 'Pending');

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
    { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
  ];

  const occupancyData = [
    { name: 'Occupied', value: occupiedRooms },
    { name: 'Vacant', value: rooms.length - occupiedRooms },
  ];
  const COLORS = ['#3b82f6', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening in your hostel today.</p>
      </div>

      {pendingLeaveNotices.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm relative overflow-hidden">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Pending Leave Notices</h3>
              <div className="mt-2 text-sm text-red-700">
                You have {pendingLeaveNotices.length} pending leave notice(s) requiring your review.
              </div>
              <div className="mt-4 space-y-3">
                {pendingLeaveNotices.map((notice: any) => (
                  <div key={notice.id} className="bg-white p-3 rounded shadow-sm border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{notice.student_name} <span className="text-xs font-normal text-gray-500">({notice.student_enrollment_no})</span></p>
                      <p className="text-xs text-gray-600">Leaving: {notice.planned_leaving_date} | Refund Eligible: <strong className={notice.eligible_for_refund ? 'text-emerald-600' : 'text-red-600'}>{notice.eligible_for_refund ? 'Yes' : 'No'}</strong></p>
                      {notice.reason && <p className="text-xs text-gray-500 mt-1 italic">"{notice.reason}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateNoticeMutation.mutate({ id: notice.id, status: 'Approved' })} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button onClick={() => updateNoticeMutation.mutate({ id: notice.id, status: 'Rejected' })} size="sm" variant="destructive" className="h-8">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Monthly)</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rs. {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+15% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Occupancy</CardTitle>
            <Building className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{occupiedRooms} / {rooms.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0}% capacity
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingComplaints}</div>
            <p className="text-xs text-red-500 font-medium mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rs. {pendingDues.toLocaleString()}</div>
            <p className="text-xs text-orange-500 font-medium mt-1">Awaiting collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Rent and fee collection over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Occupancy Status</CardTitle>
            <CardDescription>Current room utilization across all buildings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest complaints and student actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complaints.slice(0, 5).map((complaint: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-full ${complaint.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{complaint.subject}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[500px]">
                    {complaint.msg}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(complaint.date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {complaints.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No recent activity found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
