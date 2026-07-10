import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reportsTable } from "./reports";

export const reportRulesTable = pgTable("report_rules", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reportsTable.id, { onDelete: "cascade" }),
  columnName: text("column_name").notNull(),
  ruleCategory: text("rule_category").notNull().default("technical"), // business | technical | computed
  ruleType: text("rule_type").notNull(), // range | not_null | regex | cross_column | enum_check | business_check
  operator: text("operator"), // >, <, >=, <=, =, !=, matches
  value: text("value"),
  compareColumn: text("compare_column"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportRuleSchema = createInsertSchema(reportRulesTable).omit({ id: true, createdAt: true });
export type InsertReportRule = z.infer<typeof insertReportRuleSchema>;
export type ReportRule = typeof reportRulesTable.$inferSelect;
