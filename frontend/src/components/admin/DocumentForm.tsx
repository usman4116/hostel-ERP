import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
const documentSchema = z.object({
  student: z.coerce.number().min(1, "Student is required"),
  doc_type: z.string().min(1, "Document type is required"),
  verification_status: z.string().default("Pending"),
  expiry_date: z.string().optional().or(z.literal("")),
  rejection_reason: z.string().optional().or(z.literal("")),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: any;
}

export function DocumentForm({ open, onOpenChange, document: editingDoc }: DocumentFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingDoc;
  const [file, setFile] = useState<File | null>(null);

  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students/').then(res => res.data) });

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema) as any,
    defaultValues: {
      student: editingDoc?.student?.id || editingDoc?.student || 0,
      doc_type: editingDoc?.doc_type || "CNIC_Front",
      verification_status: editingDoc?.verification_status || "Pending",
      expiry_date: editingDoc?.expiry_date || "",
      rejection_reason: editingDoc?.rejection_reason || "",
    },
  });

  useEffect(() => {
    if (editingDoc) {
      form.reset({
        student: editingDoc.student?.id || editingDoc.student || 0,
        doc_type: editingDoc.doc_type || "CNIC_Front",
        verification_status: editingDoc.verification_status || "Pending",
        expiry_date: editingDoc.expiry_date || "",
        rejection_reason: editingDoc.rejection_reason || "",
      });
    } else {
      form.reset({
        student: 0,
        doc_type: "CNIC_Front",
        verification_status: "Pending",
        expiry_date: "",
        rejection_reason: "",
      });
    }
  }, [editingDoc, form]);

  const mutation = useMutation({
    mutationFn: (data: DocumentFormValues) => {
      const formData = new FormData();
      formData.append('student', String(data.student));
      formData.append('doc_type', data.doc_type);
      formData.append('verification_status', data.verification_status);
      if (data.expiry_date) formData.append('expiry_date', data.expiry_date);
      if (data.rejection_reason) formData.append('rejection_reason', data.rejection_reason);
      if (file) formData.append('file', file);

      if (isEditing) {
        return api.patch(`/documents/${editingDoc.id}/`, formData, {
          headers: { 'Content-Type': undefined }
        });
      } else {
        return api.post('/documents/', formData, {
          headers: { 'Content-Type': undefined }
        });
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Document updated!" : "Document uploaded!");
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      form.reset();
      setFile(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const errorMsg = data ? (data.detail || JSON.stringify(data)) : "Failed to save document.";
      toast.error(`Error: ${errorMsg}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Document" : "Upload Document"}</DialogTitle>
          <DialogDescription>Upload and verify student documents.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doc_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Photograph">Student Photograph</SelectItem>
                        <SelectItem value="CNIC_Front">CNIC / Passport (Front)</SelectItem>
                        <SelectItem value="CNIC_Back">CNIC / Passport (Back)</SelectItem>
                        <SelectItem value="Guardian_CNIC">Parent/Guardian CNIC</SelectItem>
                        <SelectItem value="Admission_Form">Admission Form</SelectItem>
                        <SelectItem value="Hostel_Agreement">Hostel Agreement Form</SelectItem>
                        <SelectItem value="Emergency_Contact">Emergency Contact Info</SelectItem>
                        <SelectItem value="Supporting_Doc">Supporting Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>Document File {isEditing && "(Leave blank to keep current file)"}</FormLabel>
              <FormControl>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!isEditing} />
              </FormControl>
            </FormItem>

            {isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="verification_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {form.watch('verification_status') === 'Rejected' && (
                  <FormField
                    control={form.control}
                    name="rejection_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejection Reason</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? "Save Changes" : "Upload Document"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
