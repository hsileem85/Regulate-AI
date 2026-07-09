import React from 'react';
import { useGetFraSummary } from '@workspace/api-client-react';
import { Activity, AlertTriangle, CheckCircle2, Clock, FileText, BarChart3, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function FraDashboard() {
  const { data: summary, isLoading, isError } = useGetFraSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/10 text-destructive rounded-lg">
        Failed to load control tower data. Please try again.
      </div>
    );
  }

  const complianceData = [
    { name: 'Submitted', value: summary.totalSubmitted, color: 'hsl(160 84% 39%)' }, // Emerald
    { name: 'Pending', value: summary.totalPending, color: 'hsl(35 92% 55%)' },     // Amber
    { name: 'Overdue', value: summary.totalOverdue, color: 'hsl(0 84% 60%)' },      // Destructive
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          Control Tower
        </h1>
        <p className="text-muted-foreground">Real-time oversight of financial reporting compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{summary.overallComplianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">across all domains</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Catalogues</CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeReports}</div>
            <p className="text-xs text-muted-foreground mt-1">published definitions</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Regulated Entities</CardTitle>
            <Building className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">enrolled companies</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 backdrop-blur border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue Submissions</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summary.totalOverdue}</div>
            <p className="text-xs text-destructive/80 mt-1">requiring intervention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Global Status</CardTitle>
            <CardDescription>Submission breakdown across all requests</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Compliance by Domain</CardTitle>
            <CardDescription>Average compliance rate per sector</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.domainBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="domain" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(val) => val.replace('_', ' ')}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="complianceRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Compliance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              No upcoming deadlines in the next 30 days.
            </div>
          ) : (
            <div className="space-y-4">
              {summary.upcomingDeadlines.map((deadline, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                  <div>
                    <h4 className="font-semibold">{deadline.reportName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due: {new Date(deadline.submissionDeadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-500">{deadline.pendingCount}</div>
                    <div className="text-xs text-muted-foreground">Pending Submissions</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
