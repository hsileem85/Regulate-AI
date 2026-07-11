import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, reportRequestsTable, reportsTable, companiesTable, reportColumnsTable, reportRulesTable } from "@workspace/db";
import {
  GetRequestParams,
  AcceptRequestParams,
  ValidateRequestParams,
  ValidateRequestBody,
  SubmitRequestParams,
  SubmitRequestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List requests
router.get("/requests", async (req, res): Promise<void> => {
  const { companyId, reportId, status } = req.query as {
    companyId?: string;
    reportId?: string;
    status?: string;
  };

  let requests = await db
    .select()
    .from(reportRequestsTable)
    .orderBy(reportRequestsTable.createdAt);

  if (companyId) {
    const cid = parseInt(companyId, 10);
    if (!isNaN(cid)) requests = requests.filter((r) => r.companyId === cid);
  }
  if (reportId) {
    const rid = parseInt(reportId, 10);
    if (!isNaN(rid)) requests = requests.filter((r) => r.reportId === rid);
  }
  if (status) {
    requests = requests.filter((r) => r.status === status);
  }

  res.json(requests.map(formatRequest));
});

// Get request detail
router.get("/requests/:id", async (req, res): Promise<void> => {
  const params = GetRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.id, params.data.id));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, request.reportId));
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, request.companyId));
  const columns = await db.select().from(reportColumnsTable).where(eq(reportColumnsTable.reportId, request.reportId));
  const rules = await db.select().from(reportRulesTable).where(eq(reportRulesTable.reportId, request.reportId));

  res.json({
    id: request.id,
    status: request.status,
    report: report ? {
      ...report,
      issueDate: report.issueDate ?? null,
      submissionDeadline: report.submissionDeadline ?? null,
      rulesBookUrl: report.rulesBookUrl ?? null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    } : null,
    company: company ? {
      ...company,
      createdAt: company.createdAt.toISOString(),
    } : null,
    columns: columns.map((c) => ({
      ...c,
      enumValues: c.enumValues ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    rules: rules.map((r) => ({
      ...r,
      operator: r.operator ?? null,
      value: r.value ?? null,
      compareColumn: r.compareColumn ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    acceptedAt: request.acceptedAt?.toISOString() ?? null,
    submittedAt: request.submittedAt?.toISOString() ?? null,
    submissionHash: request.submissionHash ?? null,
    validationErrors: request.validationErrorsJson
      ? (JSON.parse(request.validationErrorsJson) as Array<{row: number; column: string; message: string; value: string | null}>)
      : [],
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  });
});

// Accept request
router.post("/requests/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.id, params.data.id));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (request.status !== "pending_acceptance") {
    res.status(400).json({ error: "Request has already been accepted" });
    return;
  }

  const [updated] = await db
    .update(reportRequestsTable)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(reportRequestsTable.id, params.data.id))
    .returning();

  res.json(formatRequest(updated));
});

// Validate request data
router.post("/requests/:id/validate", async (req, res): Promise<void> => {
  const params = ValidateRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ValidateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.id, params.data.id));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const columns = await db
    .select()
    .from(reportColumnsTable)
    .where(eq(reportColumnsTable.reportId, request.reportId));

  const rules = await db
    .select()
    .from(reportRulesTable)
    .where(eq(reportRulesTable.reportId, request.reportId));

  const errors: Array<{ row: number; column: string; message: string; value: string | null }> = [];
  const data = parsed.data.data;

  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx] as Record<string, unknown>;

    // Check mandatory columns
    for (const col of columns) {
      if (col.isMandatory && (row[col.columnName] === undefined || row[col.columnName] === null || row[col.columnName] === "")) {
        errors.push({
          row: rowIdx + 1,
          column: col.columnName,
          message: `Column "${col.columnName}" is mandatory but has no value`,
          value: null,
        });
      }
    }

    // Run rules
    for (const rule of rules) {
      const rawValue = row[rule.columnName];
      const strValue = rawValue !== undefined && rawValue !== null ? String(rawValue) : null;

      if (rule.ruleType === "not_null") {
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: rule.description,
            value: strValue,
          });
        }
      } else if (rule.ruleType === "range" && rule.operator && rule.value && strValue !== null) {
        const numVal = parseFloat(strValue);
        const ruleNum = parseFloat(rule.value);
        let violated = false;
        if (rule.operator === ">") violated = !(numVal > ruleNum);
        if (rule.operator === "<") violated = !(numVal < ruleNum);
        if (rule.operator === ">=") violated = !(numVal >= ruleNum);
        if (rule.operator === "<=") violated = !(numVal <= ruleNum);
        if (rule.operator === "=") violated = numVal !== ruleNum;
        if (rule.operator === "!=") violated = numVal === ruleNum;
        if (violated) {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: `${rule.description}: value "${strValue}" violates rule (${rule.operator} ${rule.value})`,
            value: strValue,
          });
        }
      } else if (rule.ruleType === "regex" && rule.value && strValue !== null) {
        try {
          const regex = new RegExp(rule.value);
          if (!regex.test(strValue)) {
            errors.push({
              row: rowIdx + 1,
              column: rule.columnName,
              message: `${rule.description}: value "${strValue}" does not match pattern`,
              value: strValue,
            });
          }
        } catch {
          // invalid regex, skip
        }
      } else if (rule.ruleType === "enum_check" && rule.value && strValue !== null) {
        const allowed = rule.value.split(",").map((v: string) => v.trim());
        if (!allowed.includes(strValue)) {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: `${rule.description}: value "${strValue}" is not in allowed values`,
            value: strValue,
          });
        }
      } else if (rule.ruleType === "cross_column" && rule.operator && rule.compareColumn) {
        const rawCompare = row[rule.compareColumn];
        const strCompare = rawCompare !== undefined && rawCompare !== null ? String(rawCompare) : null;
        if (strValue !== null && strCompare !== null) {
          const numVal = parseFloat(strValue);
          const numCompare = parseFloat(strCompare);
          let violated = false;
          if (rule.operator === ">") violated = !(numVal > numCompare);
          else if (rule.operator === "<") violated = !(numVal < numCompare);
          else if (rule.operator === ">=") violated = !(numVal >= numCompare);
          else if (rule.operator === "<=") violated = !(numVal <= numCompare);
          else if (rule.operator === "=") violated = numVal !== numCompare;
          else if (rule.operator === "!=") violated = numVal === numCompare;
          if (violated) {
            errors.push({
              row: rowIdx + 1,
              column: `${rule.columnName} vs ${rule.compareColumn}`,
              message: `${rule.description}: "${strValue}" ${rule.operator} "${strCompare}" is not satisfied`,
              value: strValue,
            });
          }
        }
      } else if (rule.ruleType === "business_check") {
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: rule.description,
            value: strValue,
          });
        }
      } else if (rule.ruleType === "is_integer") {
        if (strValue !== null && !/^-?\d+$/.test(strValue)) {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: `${rule.description}: value "${strValue}" is not an integer`,
            value: strValue,
          });
        }
      } else if (rule.ruleType === "no_numbers") {
        if (strValue !== null && /\d/.test(strValue)) {
          errors.push({
            row: rowIdx + 1,
            column: rule.columnName,
            message: `${rule.description}: value "${strValue}" contains numbers`,
            value: strValue,
          });
        }
      }
    }
  }

  // Persist validation result and update status
  await db
    .update(reportRequestsTable)
    .set({
      status: "validating",
      validationErrorCount: errors.length,
      validationErrorsJson: JSON.stringify(errors),
    })
    .where(eq(reportRequestsTable.id, params.data.id));

  res.json({ valid: errors.length === 0, errorCount: errors.length, errors });
});

// Submit request
router.post("/requests/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.certificationAcknowledged) {
    res.status(400).json({ error: "Certification must be acknowledged before submission" });
    return;
  }

  const [request] = await db
    .select()
    .from(reportRequestsTable)
    .where(eq(reportRequestsTable.id, params.data.id));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const submissionHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(parsed.data.data) + request.id + Date.now())
    .digest("hex");

  const submittedAt = new Date();

  await db
    .update(reportRequestsTable)
    .set({ status: "submitted", submittedAt, submissionHash, validationErrorCount: 0 })
    .where(eq(reportRequestsTable.id, params.data.id));

  res.json({
    requestId: request.id,
    submissionHash,
    submittedAt: submittedAt.toISOString(),
    status: "submitted",
  });
});

function formatRequest(r: typeof reportRequestsTable.$inferSelect) {
  return {
    ...r,
    acceptedAt: r.acceptedAt?.toISOString() ?? null,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    submissionHash: r.submissionHash ?? null,
    validationErrorCount: r.validationErrorCount ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export default router;
