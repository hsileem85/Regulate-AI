import { pgTable, text, serial, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  frequency: text("frequency").notNull(), // ad-hoc | daily | weekly | monthly | quarterly | annually
  targetDomains: text("target_domains").array().notNull().default([]),
  issueDate: date("issue_date", { mode: "string" }),
  implementationWindowDays: integer("implementation_window_days").notNull().default(14),
  submissionDeadline: date("submission_deadline", { mode: "string" }),
  status: text("status").notNull().default("draft"), // draft | published
  rulesBookUrl: text("rules_book_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
