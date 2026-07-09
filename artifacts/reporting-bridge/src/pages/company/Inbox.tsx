import React, { useState } from 'react';
import { useListRequests } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { Inbox as InboxIcon, Search, Filter, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

const COMPANY_ID = 1;

export default function CompanyInbox() {
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();
  const { data: requests, isLoading } = useListRequests({ companyId: COMPANY_ID });

  // Filter requests locally by search (if report IDs were populated with names we'd filter that, but let's mock it)
  // The backend returns reportId, so we just show what we have
  const filtered = requests?.filter(r => r.status.includes(search.toLowerCase()) || r.id.toString().includes(search));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <InboxIcon className="w-8 h-8 text-primary" />
          Requests Inbox
        </h1>
        <p className="text-muted-foreground mt-1">Manage reporting requests from the FRA.</p>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search requests..." 
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
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">Report Definition</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Updated At</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Your inbox is empty.</p>
                </td>
              </tr>
            ) : (
              filtered?.map((req) => (
                <tr key={req.id} className="data-grid-row group cursor-pointer" onClick={() => setLocation(`/company/requests/${req.id}`)}>
                  <td className="px-6 py-4 font-mono text-muted-foreground">REQ-{req.id.toString().padStart(4, '0')}</td>
                  <td className="px-6 py-4 font-medium text-primary">
                    Report ID: {req.reportId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(req.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      Open <ArrowRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
