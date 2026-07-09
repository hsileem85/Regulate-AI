import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, reportsTable, reportColumnsTable, reportRulesTable, reportRequestsTable, companiesTable } from "@workspace/db";
import {
  CreateReportBody,
  UpdateReportParams,
  UpdateReportBody,
  GetReportParams,
  DeleteReportParams,
  PublishReportParams,
  GetReportComplianceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List all reports
router.get("/reports", async (req, res): Promise<void> => {
  const { status, domain } = req.query as { status?: string; domain?: string };

  let reports = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);

  if (status) {
    reports = reports.filter((r) => r.status === status);
  }
  if (domain) {
    reports = reports.filter((r) => r.targetDomains.includes(domain));
  }

  res.json(reports.map(formatReport));
});

// Create report
router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    name: parsed.data.name,
    description: parsed.data.description,
    frequency: parsed.data.frequency,
    targetDomains: parsed.data.targetDomains,
    issueDate: parsed.data.issueDate ?? null,
    implementationWindowDays: parsed.data.implementationWindowDays,
    submissionDeadline: parsed.data.submissionDeadline ?? null,
    rulesBookUrl: parsed.data.rulesBookUrl ?? null,
    status: "draft",
  }).returning();

  res.status(201).json(formatReport(report));
});

// Get report
router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(formatReport(report));
});

// Update report
router.patch("/reports/:id", async (req, res): Promise<void> => {
  const params = UpdateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
  if (parsed.data.targetDomains !== undefined) updateData.targetDomains = parsed.data.targetDomains;
  if (parsed.data.issueDate !== undefined) updateData.issueDate = parsed.data.issueDate;
  if (parsed.data.implementationWindowDays !== undefined) updateData.implementationWindowDays = parsed.data.implementationWindowDays;
  if (parsed.data.submissionDeadline !== undefined) updateData.submissionDeadline = parsed.data.submissionDeadline;
  if (parsed.data.rulesBookUrl !== undefined) updateData.rulesBookUrl = parsed.data.rulesBookUrl;

  const [report] = await db.update(reportsTable).set(updateData).where(eq(reportsTable.id, params.data.id)).returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(formatReport(report));
});

// Delete report
router.delete("/reports/:id", async (req, res): Promise<void> => {
  const params = DeleteReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft reports can be deleted" });
    return;
  }

  await db.delete(reportsTable).where(eq(reportsTable.id, params.data.id));
  res.sendStatus(204);
});

// Publish report
router.post("/reports/:id/publish", async (req, res): Promise<void> => {
  const params = PublishReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  if (report.status === "published") {
    res.status(400).json({ error: "Report is already published" });
    return;
  }

  // Find all companies in the targeted domains and create requests for them
  const companies = await db.select().from(companiesTable);
  const targetedCompanies = companies.filter((c) =>
    report.targetDomains.includes(c.domain) || report.targetDomains.includes("other")
  );

  // Create report requests for each company
  if (targetedCompanies.length > 0) {
    await db.insert(reportRequestsTable).values(
      targetedCompanies.map((company) => ({
        reportId: params.data.id,
        companyId: company.id,
        status: "pending_acceptance" as const,
      }))
    );
  }

  const [updated] = await db
    .update(reportsTable)
    .set({ status: "published" })
    .where(eq(reportsTable.id, params.data.id))
    .returning();

  res.json(formatReport(updated));
});

// Get report compliance breakdown
router.get("/reports/:id/compliance", async (req, res): Promise<void> => {
  const params = GetReportComplianceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const requests = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.reportId, params.data.id));

  const companiesForRequests = requests.length > 0
    ? await db.select().from(companiesTable).where(
        inArray(companiesTable.id, requests.map((r) => r.companyId))
      )
    : [];

  const companyMap = new Map(companiesForRequests.map((c) => [c.id, c]));

  const statusCounts = { pending: 0, accepted: 0, submitted: 0, overdue: 0 };
  const domainMap = new Map<string, { pending: number; accepted: number; submitted: number; overdue: number }>();

  for (const req of requests) {
    const company = companyMap.get(req.companyId);
    if (!company) continue;

    const domain = company.domain;
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { pending: 0, accepted: 0, submitted: 0, overdue: 0 });
    }
    const ds = domainMap.get(domain)!;

    if (req.status === "submitted") {
      statusCounts.submitted++;
      ds.submitted++;
    } else if (req.status === "overdue") {
      statusCounts.overdue++;
      ds.overdue++;
    } else if (req.status === "accepted" || req.status === "validating") {
      statusCounts.accepted++;
      ds.accepted++;
    } else {
      statusCounts.pending++;
      ds.pending++;
    }
  }

  const byDomain = Array.from(domainMap.entries()).map(([domain, counts]) => {
    const total = counts.pending + counts.accepted + counts.submitted + counts.overdue;
    const complianceRate = total > 0 ? Math.round((counts.submitted / total) * 100) : 0;
    return { domain, complianceRate, ...counts };
  });

  const total = requests.length;
  const complianceRate = total > 0 ? Math.round((statusCounts.submitted / total) * 100) : 0;

  res.json({
    reportId: report.id,
    reportName: report.name,
    totalNotified: total,
    pending: statusCounts.pending,
    accepted: statusCounts.accepted,
    submitted: statusCounts.submitted,
    overdue: statusCounts.overdue,
    byDomain,
  });
});

function formatReport(r: typeof reportsTable.$inferSelect) {
  return {
    ...r,
    issueDate: r.issueDate ?? null,
    submissionDeadline: r.submissionDeadline ?? null,
    rulesBookUrl: r.rulesBookUrl ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export default router;
