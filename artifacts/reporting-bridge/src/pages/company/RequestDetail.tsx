import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetRequest, useAcceptRequest } from '@workspace/api-client-react';
import { ArrowLeft, BookOpen, CheckCircle, Database } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getGetRequestQueryKey } from '@workspace/api-client-react';

export default function RequestDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useGetRequest(id, { query: { enabled: !!id, queryKey: getGetRequestQueryKey(id) } });
  const acceptRequest = useAcceptRequest();

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!request) return <div className="p-8">Request not found.</div>;

  const handleAccept = async () => {
    try {
      await acceptRequest.mutateAsync({ id });
      toast({ title: "Request Accepted", description: "You can now enter the data workspace." });
      queryClient.invalidateQueries({ queryKey: getGetRequestQueryKey(id) });
    } catch (e) {
      toast({ title: "Error", description: "Failed to accept request.", variant: "destructive" });
    }
  };

  const isPending = request.status === 'pending_acceptance';

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/company/inbox" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Inbox
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Request REQ-{id.toString().padStart(4, '0')}</h1>
            <StatusBadge status={request.status} />
          </div>
        </div>
        <div>
          {isPending ? (
            <Button onClick={handleAccept} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <CheckCircle className="w-4 h-4" />
              Acknowledge & Accept
            </Button>
          ) : (
            <Button onClick={() => setLocation(`/company/requests/${id}/workspace`)} className="bg-primary gap-2">
              <Database className="w-4 h-4" />
              Open Data Workspace
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {/* Left Panel: Read-only metadata */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b border-border pb-4">
            <BookOpen className="w-5 h-5 text-primary" /> Regulatory Directive
          </h2>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Report Name</div>
              <div className="text-lg font-medium text-foreground">{request.report.name}</div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Legal Basis & Description</div>
              <div className="text-foreground/90 leading-relaxed text-sm bg-muted/30 p-4 rounded-lg border border-border/50">
                {request.report.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Frequency</div>
                <div className="font-medium capitalize">{request.report.frequency}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Deadline</div>
                <div className="font-medium text-amber-500">
                  {request.report.submissionDeadline ? new Date(request.report.submissionDeadline).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Schema Preview */}
        <div className="bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/10">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" /> Expected Schema
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Data must adhere to this exact structure.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left sticky top-0 backdrop-blur z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Column Key</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {request.columns.map(col => (
                  <tr key={col.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono text-primary font-medium">{col.columnName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs uppercase tracking-wider">
                        {col.dataType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {col.isMandatory ? (
                        <span className="text-destructive font-bold text-xs uppercase">Yes</span>
                      ) : (
                        <span className="text-muted-foreground text-xs uppercase">No</span>
                      )}
                    </td>
                  </tr>
                ))}
                {request.columns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No schema defined.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
