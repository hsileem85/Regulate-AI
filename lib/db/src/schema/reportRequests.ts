import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reportsTable } from "./reports";
import { companiesTable } from "./companies";

export const reportRequestsTable = pgTable("report_requests", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reportsTable.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending_acceptance"), // pending_acceptance | accepted | validating | submitted | overdue
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  submissionHash: text("submission_hash"),
  validationErrorCount: integer("validation_error_count"),
  validationErrorsJson: text("validation_errors_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReportRequestSchema = createInsertSchema(reportRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReportRequest = z.infer<typeof insertReportRequestSchema>;
export type ReportRequest = typeof reportRequestsTable.$inferSelect;
