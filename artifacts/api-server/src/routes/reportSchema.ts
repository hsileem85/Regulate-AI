import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reportColumnsTable } from "@workspace/db";
import {
  ListReportColumnsParams,
  CreateReportColumnParams,
  CreateReportColumnBody,
  DeleteReportColumnParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List columns for a report
router.get("/reports/:reportId/schema", async (req, res): Promise<void> => {
  const params = ListReportColumnsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const columns = await db
    .select()
    .from(reportColumnsTable)
    .where(eq(reportColumnsTable.reportId, params.data.reportId))
    .orderBy(reportColumnsTable.createdAt);

  res.json(columns.map(formatColumn));
});

// Add a column
router.post("/reports/:reportId/schema", async (req, res): Promise<void> => {
  const params = CreateReportColumnParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReportColumnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [column] = await db.insert(reportColumnsTable).values({
    reportId: params.data.reportId,
    columnName: parsed.data.columnName,
    dataType: parsed.data.dataType,
    description: parsed.data.description,
    isMandatory: parsed.data.isMandatory,
    enumValues: parsed.data.enumValues ?? null,
  }).returning();

  res.status(201).json(formatColumn(column));
});

// Delete a column
router.delete("/reports/:reportId/schema/:columnId", async (req, res): Promise<void> => {
  const params = DeleteReportColumnParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [column] = await db
    .delete(reportColumnsTable)
    .where(
      and(
        eq(reportColumnsTable.id, params.data.columnId),
        eq(reportColumnsTable.reportId, params.data.reportId)
      )
    )
    .returning();

  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }

  res.sendStatus(204);
});

function formatColumn(c: typeof reportColumnsTable.$inferSelect) {
  return {
    ...c,
    enumValues: c.enumValues ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

export default router;
