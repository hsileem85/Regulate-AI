import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reportRulesTable } from "@workspace/db";
import {
  ListReportRulesParams,
  CreateReportRuleParams,
  CreateReportRuleBody,
  DeleteReportRuleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List rules for a report
router.get("/reports/:reportId/rules", async (req, res): Promise<void> => {
  const params = ListReportRulesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rules = await db
    .select()
    .from(reportRulesTable)
    .where(eq(reportRulesTable.reportId, params.data.reportId))
    .orderBy(reportRulesTable.createdAt);

  res.json(rules.map(formatRule));
});

// Add a rule
router.post("/reports/:reportId/rules", async (req, res): Promise<void> => {
  const params = CreateReportRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReportRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db.insert(reportRulesTable).values({
    reportId: params.data.reportId,
    columnName: parsed.data.columnName,
    ruleType: parsed.data.ruleType,
    operator: parsed.data.operator ?? null,
    value: parsed.data.value ?? null,
    compareColumn: parsed.data.compareColumn ?? null,
    description: parsed.data.description,
  }).returning();

  res.status(201).json(formatRule(rule));
});

// Delete a rule
router.delete("/reports/:reportId/rules/:ruleId", async (req, res): Promise<void> => {
  const params = DeleteReportRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [rule] = await db
    .delete(reportRulesTable)
    .where(
      and(
        eq(reportRulesTable.id, params.data.ruleId),
        eq(reportRulesTable.reportId, params.data.reportId)
      )
    )
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.sendStatus(204);
});

function formatRule(r: typeof reportRulesTable.$inferSelect) {
  return {
    ...r,
    operator: r.operator ?? null,
    value: r.value ?? null,
    compareColumn: r.compareColumn ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export default router;
