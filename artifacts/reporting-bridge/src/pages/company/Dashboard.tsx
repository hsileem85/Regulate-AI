import React from 'react';
import { useGetCompanySummary } from '@workspace/api-client-react';
import { AlertCircle, Clock, CheckCircle2, Inbox, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';

// Hardcoded company ID for demonstration of the company portal
const COMPANY_ID = 1;

export default function CompanyDashboard() {
  const { data: summary, isLoading, isError } = useGetCompanySummary({ companyId: COMPANY_ID });

  if (isLoading) {
    return <div className="space-y-6 p-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-32 w-full" /></div>;
  }

  if (isError || !summary) {
    return <div className="p-6 bg-destructive/10 text-destructive rounded">Error loading dashboard.</div>;
  }

  const requiresAction = summary.pendingAcceptance > 0 || summary.overdue > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {requiresAction && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-6 flex items-start gap-4 shadow-lg shadow-amber-500/5">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-500">Action Required</h3>
            <p className="text-amber-500/80 mt-1">
              You have {summary.pendingAcceptance > 0 && <span className="font-bold">{summary.pendingAcceptance} new requests</span>} 
              {summary.pendingAcceptance > 0 && summary.overdue > 0 && ' and '}
              {summary.overdue > 0 && <span className="font-bold text-destructive">{summary.overdue} overdue reports</span>} 
              that demand immediate attention.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-amber-500 text-white border-none hover:bg-amber-600">
            <Link href="/company/inbox">Go to Inbox</Link>
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {summary.companyName}</h1>
        <p className="text-muted-foreground mt-1">Your regulatory reporting command center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Acceptance</CardTitle>
            <Inbox className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{summary.pendingAcceptance}</div>
            <p className="text-xs text-muted-foreground mt-1">New requests from FRA</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.accepted + summary.validating}</div>
            <p className="text-xs text-muted-foreground mt-1">Accepted & Validating</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{summary.submitted}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed compliances</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
            <Clock className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summary.overdue}</div>
            <p className="text-xs text-destructive/80 mt-1">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {summary.recentActivity.map((act, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link href={`/company/requests/${act.requestId}`} className="font-medium hover:underline">
                          {act.reportName}
                        </Link>
                        <span className="text-xs text-muted-foreground">{new Date(act.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={act.status as any} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
