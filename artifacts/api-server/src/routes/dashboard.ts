import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable, companiesTable, reportRequestsTable } from "@workspace/db";

const router: IRouter = Router();

// FRA Control Tower summary
router.get("/dashboard/fra-summary", async (_req, res): Promise<void> => {
  const [reports, companies, requests] = await Promise.all([
    db.select().from(reportsTable),
    db.select().from(companiesTable),
    db.select().from(reportRequestsTable),
  ]);

  const publishedReports = reports.filter((r) => r.status === "published");
  const totalSubmitted = requests.filter((r) => r.status === "submitted").length;
  const totalOverdue = requests.filter((r) => r.status === "overdue").length;
  const totalPending = requests.filter((r) => r.status === "pending_acceptance").length;

  const complianceRate = requests.length > 0
    ? Math.round((totalSubmitted / requests.length) * 100)
    : 0;

  // Domain breakdown
  const domainMap = new Map<string, { pending: number; accepted: number; submitted: number; overdue: number }>();
  for (const company of companies) {
    if (!domainMap.has(company.domain)) {
      domainMap.set(company.domain, { pending: 0, accepted: 0, submitted: 0, overdue: 0 });
    }
  }

  for (const request of requests) {
    const company = companies.find((c) => c.id === request.companyId);
    if (!company) continue;
    const ds = domainMap.get(company.domain);
    if (!ds) continue;
    if (request.status === "submitted") ds.submitted++;
    else if (request.status === "overdue") ds.overdue++;
    else if (request.status === "accepted" || request.status === "validating") ds.accepted++;
    else ds.pending++;
  }

  const domainBreakdown = Array.from(domainMap.entries()).map(([domain, counts]) => {
    const total = counts.pending + counts.accepted + counts.submitted + counts.overdue;
    return {
      domain,
      complianceRate: total > 0 ? Math.round((counts.submitted / total) * 100) : 0,
      submitted: counts.submitted,
      pending: counts.pending + counts.overdue,
      overdue: counts.overdue,
    };
  });

  // Upcoming deadlines
  const today = new Date();
  const upcomingDeadlines = publishedReports
    .filter((r) => r.submissionDeadline)
    .sort((a, b) => {
      const da = new Date(a.submissionDeadline!).getTime();
      const db2 = new Date(b.submissionDeadline!).getTime();
      return da - db2;
    })
    .slice(0, 5)
    .map((r) => {
      const pending = requests.filter(
        (req) => req.reportId === r.id && req.status !== "submitted"
      ).length;
      return {
        reportId: r.id,
        reportName: r.name,
        submissionDeadline: r.submissionDeadline!,
        pendingCount: pending,
      };
    });

  res.json({
    activeReports: publishedReports.length,
    totalCompanies: companies.length,
    overallComplianceRate: complianceRate,
    totalSubmitted,
    totalOverdue,
    totalPending,
    domainBreakdown,
    upcomingDeadlines,
  });
});

// Company dashboard summary
router.get("/dashboard/company-summary", async (req, res): Promise<void> => {
  const rawId = req.query.companyId as string;
  const companyId = parseInt(rawId, 10);
  if (isNaN(companyId)) {
    res.status(400).json({ error: "Invalid companyId" });
    return;
  }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId));
  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const requests = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.companyId, companyId));

  const allReports = await db.select().from(reportsTable);
  const reportMap = new Map(allReports.map((r) => [r.id, r]));

  const counts = {
    pendingAcceptance: requests.filter((r) => r.status === "pending_acceptance").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    validating: requests.filter((r) => r.status === "validating").length,
    submitted: requests.filter((r) => r.status === "submitted").length,
    overdue: requests.filter((r) => r.status === "overdue").length,
  };

  const recentActivity = requests
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10)
    .map((r) => ({
      requestId: r.id,
      reportName: reportMap.get(r.reportId)?.name ?? "Unknown Report",
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    }));

  res.json({
    companyName: company.name,
    ...counts,
    recentActivity,
  });
});

export default router;
