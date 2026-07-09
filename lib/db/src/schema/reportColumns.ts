import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reportsTable } from "./reports";

export const reportColumnsTable = pgTable("report_columns", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reportsTable.id, { onDelete: "cascade" }),
  columnName: text("column_name").notNull(),
  dataType: text("data_type").notNull(), // string | integer | decimal | date | boolean | enum
  description: text("description").notNull(),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  enumValues: text("enum_values"), // comma-separated list for enum type
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportColumnSchema = createInsertSchema(reportColumnsTable).omit({ id: true, createdAt: true });
export type InsertReportColumn = z.infer<typeof insertReportColumnSchema>;
export type ReportColumn = typeof reportColumnsTable.$inferSelect;
