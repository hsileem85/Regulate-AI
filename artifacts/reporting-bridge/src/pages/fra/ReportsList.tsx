import React, { useState } from 'react';
import { useListReports, useDeleteReport } from '@workspace/api-client-react';
import { Plus, Search, Filter, MoreHorizontal, FileText, Trash2, Eye } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getListReportsQueryKey } from '@workspace/api-client-react';

export default function FraReports() {
  const [search, setSearch] = useState('');
  const { data: reports, isLoading } = useListReports();
  const deleteReport = useDeleteReport();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredReports = reports?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this draft report?')) {
      deleteReport.mutate({ id }, {
        onSuccess: () => {
          toast({ title: 'Report deleted', description: 'The draft report has been removed.' });
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        },
        onError: () => {
          toast({ title: 'Error', description: 'Could not delete report.', variant: 'destructive' });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporting Catalogue</h1>
          <p className="text-muted-foreground mt-1">Manage reporting definitions and rulebooks.</p>
        </div>
        <Button onClick={() => setLocation('/fra/reports/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Definition
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search catalogues..." 
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
                <th className="px-6 py-4">Report Name</th>
                <th className="px-6 py-4">Target Domains</th>
                <th className="px-6 py-4">Frequency</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredReports?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No reporting catalogues found.</p>
                  </td>
                </tr>
              ) : (
                filteredReports?.map((report) => (
                  <tr key={report.id} className="data-grid-row group">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link href={`/fra/reports/${report.id}`} className="hover:underline">
                        {report.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1 font-normal line-clamp-1">{report.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {report.targetDomains.map(d => (
                          <span key={d} className="text-[10px] uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                            {d.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">{report.frequency}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(report.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/fra/reports/${report.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {report.status === 'draft' && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(report.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Draft
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
