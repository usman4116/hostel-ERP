'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Loader2, FileSignature, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface CompanySettings {
  name: string;
  address?: string;
  contact_number?: string;
  email?: string;
  logo?: string;
}

interface Contract {
  id: number;
  student: number;
  student_name: string;
  student_cnic: string;
  student_enrollment_no: string;
  contract_text: string;
  is_signed: boolean;
  signed_at: string | null;
  signature_text: string | null;
  company_settings: CompanySettings | null;
  created_at: string;
}

export default function ContractPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    try {
      const response = await api.get('/contracts/');
      if (response.data && response.data.length > 0) {
        setContract(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      toast.error("Failed to load your contract.");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureText.trim()) {
      toast.error("Please type your full name to sign.");
      return;
    }

    if (!contract) return;

    setSigning(true);
    try {
      await api.post(`/contracts/${contract.id}/sign/`, { signature_text: signatureText });
      toast.success("Contract signed successfully.");
      fetchContract(); // Reload contract
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to sign contract.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8">
        <Card className="max-w-3xl mx-auto bg-card border-card-border shadow-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileSignature className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Contract Found</h2>
            <p className="text-muted-foreground">The administration has not assigned a contract to you yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { company_settings } = contract;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <FileSignature className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Contract</h1>
          <p className="text-muted-foreground text-sm">Please review and digitally sign your accommodation agreement.</p>
        </div>
      </div>

      <Card className="bg-card border-card-border shadow-xl overflow-hidden relative">
        {contract.is_signed && (
          <div className="absolute top-0 right-0 bg-green-500/10 text-green-500 px-6 py-2 rounded-bl-xl font-bold flex items-center gap-2 border-b border-l border-green-500/20">
            <CheckCircle className="w-4 h-4" />
            Signed & Locked
          </div>
        )}
        
        <CardContent className="p-0">
          <div className="p-8 border-b border-card-border bg-card/50">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {company_settings?.logo ? (
                  <img src={company_settings.logo} alt="Logo" className="w-16 h-16 object-contain rounded-md bg-white p-1" />
                ) : (
                  <div className="w-16 h-16 bg-primary/20 rounded-md flex items-center justify-center font-bold text-xl text-primary">
                    {company_settings?.name?.charAt(0) || "H"}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{company_settings?.name || "Hostel Administration"}</h2>
                  <p className="text-muted-foreground text-sm max-w-sm">{company_settings?.address || ""}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary uppercase tracking-wider">Accommodation Agreement</p>
                <p className="text-xs text-muted-foreground mt-1">Ref: {contract.student_enrollment_no}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-card-border flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Student Name</p>
                <p className="font-medium text-lg">{contract.student_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">CNIC / B-Form</p>
                <p className="font-medium text-lg">{contract.student_cnic || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date Issued</p>
                <p className="font-medium text-lg">{new Date(contract.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="p-8 prose prose-invert max-w-none text-foreground/80 font-serif leading-relaxed">
            {contract.contract_text.split('\n').map((paragraph, idx) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <h3 key={idx} className="text-xl font-bold text-foreground mt-6 mb-2">{paragraph.replace(/\*\*/g, '')}</h3>;
              }
              return paragraph.trim() ? <p key={idx} className="mb-4">{paragraph}</p> : null;
            })}
          </div>

          <div className="p-8 bg-sidebar/50 border-t border-card-border">
            {!contract.is_signed ? (
              <div className="max-w-md">
                <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-primary" />
                  Digital Signature
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  By typing your full name below and clicking 'Sign Contract', you agree that this constitutes your legal digital signature.
                </p>
                <div className="flex flex-col gap-3">
                  <Input 
                    placeholder="Type your full legal name..." 
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="bg-background border-card-border h-12 text-lg"
                  />
                  <Button 
                    onClick={handleSign} 
                    disabled={signing || !signatureText.trim()}
                    className="w-full h-12 text-md font-bold"
                  >
                    {signing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {signing ? "Signing..." : "Sign Contract"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-background border border-card-border p-6 rounded-lg max-w-md">
                <h4 className="text-lg font-bold text-green-500 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Contract Signed
                </h4>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between border-b border-card-border pb-2">
                    <span className="text-muted-foreground text-sm">Digitally Signed By:</span>
                    <span className="font-bold text-primary font-mono">{contract.signature_text}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground text-sm">Timestamp:</span>
                    <span className="font-medium text-sm">{new Date(contract.signed_at!).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
