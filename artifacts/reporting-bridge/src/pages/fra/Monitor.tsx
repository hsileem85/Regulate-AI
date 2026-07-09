import React, { useState } from 'react';
import { useListRequests, useListCompanies } from '@workspace/api-client-react';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function FraMonitor() {
  const [search, setSearch] = useState('');
  
  // Fetch lists
  const { data: requests, isLoading: loadingRequests } = useListRequests();
  const { data: companies, isLoading: loadingCompanies } = useListCompanies();

  // Create a quick lookup map for companies
  const compMap = new Map(companies?.map(c => [c.id, c]));

  const filteredRequests = requests?.filter(req => {
    const compName = compMap.get(req.companyId)?.name?.toLowerCase() || '';
    return compName.includes(search.toLowerCase()) || req.status.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Status Monitor</h1>
        <p className="text-muted-foreground mt-1">Live tracking of all entity submission requests.</p>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by entity name or status..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Report Request</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingRequests || loadingCompanies ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                  </tr>
                ))
              ) : filteredRequests?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No active requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests?.map((req) => {
                  const company = compMap.get(req.companyId);
                  return (
                    <tr key={req.id} className="data-grid-row hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {company?.name || `Entity #${req.companyId}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                          {company?.domain.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        Report ID: {req.reportId}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(req.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {req.validationErrorCount != null && req.validationErrorCount > 0 ? (
                          <div className="flex items-center gap-1 text-destructive font-medium">
                            <ShieldAlert className="w-4 h-4" /> {req.validationErrorCount}
                          </div>
                        ) : req.status === 'submitted' ? (
                          <span className="text-emerald-500 font-medium">0</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
