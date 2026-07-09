import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetRequest, useValidateRequest, useSubmitRequest, getGetRequestQueryKey } from '@workspace/api-client-react';
import { UploadCloud, Play, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function Workspace() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: request, refetch } = useGetRequest(id, { query: { enabled: !!id, queryKey: getGetRequestQueryKey(id) } });
  const validate = useValidateRequest();
  const submit = useSubmitRequest();

  const [hasFile, setHasFile] = useState(false);
  const [certify, setCertify] = useState(false);
  const [validationRun, setValidationRun] = useState(false);
  
  if (!request) return null;

  // Since we don't have a real file parser on frontend here, we'll mock sending dummy data to the validate endpoint
  const handleValidate = async () => {
    try {
      await validate.mutateAsync({
        id,
        data: { data: [{ "mock": "data" }] } // In a real app, parse CSV and send
      });
      setValidationRun(true);
      refetch(); // Refetch request to get updated error count
      toast({ title: 'Validation Complete', description: 'Check the error log.' });
    } catch (e) {
      toast({ title: 'Validation Failed', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!certify) {
      toast({ title: 'Certification Required', description: 'You must certify the accuracy of the data.', variant: 'destructive' });
      return;
    }
    try {
      await submit.mutateAsync({
        id,
        data: { certificationAcknowledged: true, data: [{ "mock": "data" }] }
      });
      setLocation(`/company/requests/${id}/receipt`);
    } catch (e) {
      toast({ title: 'Submission Failed', variant: 'destructive' });
    }
  };

  const isClean = validationRun && request.validationErrors?.length === 0;
  const hasErrors = request.validationErrors && request.validationErrors.length > 0;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/company/requests/${id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Request
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Data Workspace</h1>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              hasFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card hover:bg-muted/50'
            } cursor-pointer`}
            onClick={() => setHasFile(true)}
          >
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${hasFile ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{hasFile ? 'dataset_q3_final.csv' : 'Drop dataset here'}</h3>
            <p className="text-sm text-muted-foreground">
              {hasFile ? '1,420 rows loaded. Ready for validation.' : 'CSV, Excel, or XML. Max 50MB.'}
            </p>
          </div>

          <Button 
            className="w-full gap-2 h-12 text-lg" 
            size="lg"
            onClick={handleValidate}
            disabled={!hasFile || validate.isPending}
          >
            <Play className="w-5 h-5" />
            Run Validation Engine
          </Button>

          {isClean && (
            <div className="bg-card border border-border p-6 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="certify" checked={certify} onCheckedChange={(c) => setCertify(!!c)} />
                <label htmlFor="certify" className="text-sm leading-tight text-muted-foreground cursor-pointer">
                  I hereby certify that the data provided is accurate, complete, and true to the best of my knowledge.
                </label>
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12"
                onClick={handleSubmit}
                disabled={submit.isPending}
              >
                <CheckCircle className="w-5 h-5 mr-2" /> Submit Officially
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Error Log */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" /> Error Log
            </h2>
            {validationRun && (
              <StatusBadge 
                status={hasErrors ? "overdue" : "submitted"} 
                label={hasErrors ? `${request.validationErrors.length} Errors Found` : "0 Errors"} 
              />
            )}
          </div>
          
          <div className="flex-1 p-0 overflow-y-auto min-h-[400px]">
            {!validationRun ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                <Play className="w-12 h-12 opacity-20 mb-4" />
                <p>Upload data and run the validation engine to see results.</p>
              </div>
            ) : hasErrors ? (
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Row</th>
                    <th className="px-4 py-2 text-left font-medium">Column</th>
                    <th className="px-4 py-2 text-left font-medium">Message</th>
                    <th className="px-4 py-2 text-left font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {request.validationErrors.map((err, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono">{err.row}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{err.column}</td>
                      <td className="px-4 py-3 text-destructive">{err.message}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground bg-muted/30">{err.value || 'null'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-emerald-500 p-12 text-center">
                <CheckCircle className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-bold mb-2">Zero Errors</h3>
                <p className="text-emerald-500/80">Data strictly adheres to the catalogue schema and rules. Ready for submission.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
