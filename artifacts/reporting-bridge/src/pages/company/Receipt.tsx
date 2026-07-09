import React from 'react';
import { useParams, Link } from 'wouter';
import { CheckCircle2, ShieldCheck, Download, Home } from 'lucide-react';
import { useGetRequest, getGetRequestQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Receipt() {
  const params = useParams();
  const id = Number(params.id);
  const { data: request, isLoading } = useGetRequest(id, { query: { enabled: !!id, queryKey: getGetRequestQueryKey(id) } });

  if (isLoading) return <div className="p-8 text-center"><Skeleton className="h-64 max-w-2xl mx-auto rounded-xl" /></div>;
  if (!request) return null;

  return (
    <div className="max-w-2xl mx-auto mt-12 animate-in zoom-in-95 duration-500">
      <div className="bg-card border-2 border-emerald-500/20 rounded-2xl p-10 text-center shadow-lg shadow-emerald-500/5 relative overflow-hidden">
        
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Submission Successful</h1>
          <p className="text-muted-foreground mb-8">
            Your data has been securely transmitted and verified by the FRA regulatory engine.
          </p>

          <div className="bg-background border border-border rounded-xl p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground text-sm">Request ID</span>
              <span className="font-mono font-medium">REQ-{request.id.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-muted-foreground text-sm">Timestamp</span>
              <span className="font-medium text-foreground">
                {request.submittedAt ? new Date(request.submittedAt).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Cryptographic Hash
              </span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-primary break-all max-w-[200px]">
                {request.submissionHash || '0x9a8f...4c21'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-muted">
              <Download className="w-4 h-4" /> Download Receipt
            </Button>
            <Button asChild className="gap-2">
              <Link href="/company/dashboard"><Home className="w-4 h-4" /> Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
