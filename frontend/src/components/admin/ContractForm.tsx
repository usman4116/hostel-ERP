"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: any; // null for create, object for edit
}

const DEFAULT_CONTRACT = `**HOSTEL ACCOMMODATION AGREEMENT**

This Agreement is entered into between the Hostel Administration and the Student.

**1. ALLOCATION OF ROOM**
The student is allocated a room based on availability and agrees to adhere to the room assignment.

**2. RENT AND PAYMENTS**
The student agrees to pay the monthly rent and any associated utility charges on or before the due date each month. Failure to pay may result in late fees or eviction.

**3. DISCIPLINE AND CONDUCT**
- The student must maintain a peaceful environment.
- Ragging, smoking, alcohol, and illegal substances are strictly prohibited.
- Damage to hostel property will be fined and deducted from the security deposit.

**4. TERMINATION OF AGREEMENT**
The administration reserves the right to terminate this agreement and evict the student without prior notice in case of severe misconduct or continuous default on payments.

By signing below, I acknowledge that I have read, understood, and agree to abide by all the rules and regulations of the hostel.`;

export function ContractForm({ isOpen, onClose, contract }: ContractFormProps) {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState<string>("");
  const [contractText, setContractText] = useState(DEFAULT_CONTRACT);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students/').then(res => res.data)
  });

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        setStudentId(contract.student.toString());
        setContractText(contract.contract_text);
      } else {
        setStudentId("");
        setContractText(DEFAULT_CONTRACT);
      }
    }
  }, [isOpen, contract]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (contract) {
        return api.patch(`/contracts/${contract.id}/`, data);
      }
      return api.post('/contracts/', data);
    },
    onSuccess: () => {
      toast.success(contract ? "Contract updated!" : "Contract created!");
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.student?.[0] || err.response?.data?.detail || "Failed to save contract");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Please select a student.");
      return;
    }
    if (!contractText.trim()) {
      toast.error("Contract text cannot be empty.");
      return;
    }

    saveMutation.mutate({
      student: parseInt(studentId),
      contract_text: contractText,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Contract" : "Create New Contract"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select 
              value={studentId} 
              onValueChange={(val) => setStudentId(val || "")}
              disabled={!!contract} // Cannot change student if editing
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent>
                {loadingStudents ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name} ({student.enrollment_no})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contract Text (Supports Markdown **bold** headings)</Label>
            <Textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter legal contract text here..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contract ? "Save Changes" : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
