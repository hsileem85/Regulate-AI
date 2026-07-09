import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetReport, useGetReportCompliance, useListReportColumns, getGetReportQueryKey, getGetReportComplianceQueryKey, getListReportColumnsQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, Download, Eye, Link as LinkIcon, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportDetail() {
  const params = useParams();
  const id = Number(params.id);
  
  const { data: report, isLoading: loadingReport } = useGetReport(id, { query: { enabled: !!id, queryKey: getGetReportQueryKey(id) } });
  const { data: compliance, isLoading: loadingCompliance } = useGetReportCompliance(id, { query: { enabled: !!id, queryKey: getGetReportComplianceQueryKey(id) } });
  const { data: columns, isLoading: loadingColumns } = useListReportColumns(id, { query: { enabled: !!id, queryKey: getListReportColumnsQueryKey(id) } });

  if (loadingReport) {
    return <div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (!report) {
    return <div className="p-8 text-center">Report not found.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/fra/reports" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Catalogue
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-muted-foreground max-w-2xl">{report.description}</p>
        </div>
        <div className="flex gap-2">
          {report.rulesBookUrl && (
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Rulebook PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frequency</div>
              <div className="font-medium capitalize">{report.frequency}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Domains</div>
              <div className="flex flex-wrap gap-1">
                {report.targetDomains.map(d => (
                  <span key={d} className="text-[10px] uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded">
                    {d.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Implementation Window</div>
              <div className="font-medium">{report.implementationWindowDays} Days</div>
            </div>
            {report.submissionDeadline && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deadline</div>
                <div className="font-medium text-amber-500">{new Date(report.submissionDeadline).toLocaleDateString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCompliance ? (
              <Skeleton className="h-32 w-full" />
            ) : compliance ? (
              <div className="space-y-8">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-foreground">{compliance.totalNotified}</div>
                    <div className="text-sm text-muted-foreground mt-1">Notified Entities</div>
                  </div>
                  <div className="flex-1 flex gap-2 h-12 rounded-full overflow-hidden bg-muted">
                    <div style={{ width: `${(compliance.submitted / compliance.totalNotified) * 100}%` }} className="bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {compliance.submitted > 0 && compliance.submitted}
                    </div>
                    <div style={{ width: `${(compliance.accepted / compliance.totalNotified) * 100}%` }} className="bg-blue-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {compliance.accepted > 0 && compliance.accepted}
                    </div>
                    <div style={{ width: `${(compliance.pending / compliance.totalNotified) * 100}%` }} className="bg-amber-500 h-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {compliance.pending > 0 && compliance.pending}
                    </div>
                    <div style={{ width: `${(compliance.overdue / compliance.totalNotified) * 100}%` }} className="bg-destructive h-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {compliance.overdue > 0 && compliance.overdue}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Submitted</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Accepted</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Pending</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive"></div> Overdue</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">No compliance data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="border border-border/50 bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold text-lg">Schema Definition</h3>
        </div>
        {loadingColumns ? (
          <div className="p-4"><Skeleton className="h-20 w-full" /></div>
        ) : columns && columns.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left">
              <tr>
                <th className="px-6 py-3">Column Key</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Requirement</th>
                <th className="px-6 py-3">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {columns.map(col => (
                <tr key={col.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-mono text-primary">{col.columnName}</td>
                  <td className="px-6 py-4">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs uppercase tracking-wider">{col.dataType}</span>
                  </td>
                  <td className="px-6 py-4">
                    {col.isMandatory ? <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Required</span> : <span className="text-muted-foreground text-xs uppercase tracking-wider">Optional</span>}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {col.enumValues ? `Enum: ${col.enumValues}` : 'Standard type check'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            No columns defined for this report.
          </div>
        )}
      </div>

    </div>
  );
}
