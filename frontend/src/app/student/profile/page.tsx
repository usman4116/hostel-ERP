'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User, Phone, Mail, GraduationCap, MapPin, Building, Activity, Contact } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function StudentProfile() {
  const { data: students, isLoading } = useQuery({ 
    queryKey: ['my-profile'], 
    queryFn: () => api.get('/students/').then(res => res.data) 
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const profile = students && students.length > 0 ? students[0] : null;

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">No Profile Found</h2>
          <p className="text-muted-foreground mt-2">Your student profile has not been fully configured yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your personal information and hostel details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment No.</p>
                <p className="font-medium">{profile.enrollment_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Father's Name</p>
                <p className="font-medium">{profile.father_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{profile.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{profile.dob || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium flex items-center gap-1">
                  <Activity className="w-3 h-3 text-red-500" />
                  {profile.blood_group || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contact className="w-5 h-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile Number</p>
                  <p className="font-medium">{profile.mobile_no || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{profile.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Permanent Address</p>
                  <p className="font-medium">{profile.permanent_address || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">University</p>
                <p className="font-medium">{profile.university || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-medium">{profile.course || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="font-medium">{profile.semester || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hostel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Hostel Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room Number</p>
                <p className="font-medium text-lg text-primary">{profile.room_no || "Unassigned"}</p>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Emergency Contacts</h4>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Number</p>
                  <p className="font-medium">{profile.emergency_contact || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local Guardian Name</p>
                  <p className="font-medium">{profile.local_guardian_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Local Guardian Phone</p>
                  <p className="font-medium">{profile.local_guardian_phone || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
