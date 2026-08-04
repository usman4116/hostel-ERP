'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, Calendar as CalendarIcon, Check, X, Trash, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EventForm } from "@/components/admin/EventForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminCalendarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({ 
    queryKey: ['calendar'], 
    queryFn: () => api.get('/calendar/').then(res => res.data) 
  });

  const filtered = events.filter((e: any) => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/calendar/${id}/`),
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    }
  });

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar Events</h2>
          <p className="text-muted-foreground mt-1">Manage scheduled events, reminders, and Google Calendar sync.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <EventForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        event={editingEvent} 
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Events</CardTitle>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Reminder Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No events found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((event: any) => (
                    <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {event.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted">
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(event.event_date).toLocaleString()}</TableCell>
                      <TableCell>{event.student || 'N/A'}</TableCell>
                      <TableCell>
                        {event.reminder_sent ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-muted transition-colors h-8 w-8 p-0 outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(event)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(event.id)} className="text-red-500 focus:text-red-500">
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
