---
name: Regulate AI — Reporting Bridge
description: Architecture decisions and gotchas for the FRA regulatory reporting platform
---

**Why:** PRD from attached .docx; dual-portal SaaS-style prototype for FRA stakeholder buy-in.

**How to apply:**
- FRA portal routes: `/fra/*` — Control Tower, Reporting Catalogue, Status Monitor, Regulated Entities
- Company portal routes: `/company/*` — Dashboard/Inbox, Request Detail, Validation Workspace, Receipt
- Portal switcher in sidebar bottom ("Switch to Entity Portal")
- State machine: draft → published → pending_acceptance → accepted → validating → submitted | overdue
- Validation errors now persisted in `report_requests.validation_errors_json` (TEXT, JSON-encoded array); GET /requests/:id returns parsed array
- DELETE /reports/:id is draft-only (400 if status=published)
- No auth system — this is a prototype; IDOR risk noted but acceptable for stakeholder demo
- Seed data: 8 companies (real EG finance names), 5 reports (3 published, 2 draft), 5 requests with varied statuses
- DB tables: reports, report_columns, report_rules, companies, report_requests (all in lib/db/src/schema/)
- Rule categories added to `report_rules.rule_category`: `business` | `technical` | `computed`; rule types now include `business_check` and `cross_column`
- Validation engine handles `cross_column` (numeric comparison between two columns) and `business_check` (semantic presence check) in `artifacts/api-server/src/routes/requests.ts`
- Regulated Entities page at `/fra/companies` lists companies grouped by domain with domain filter and search
- Catalogue Builder Rule Engine tab has tabs for Business / Technical / Computed rules with full form and rule list table
- Entity Workspace supports real CSV file upload, parses rows, and after validation shows Good Records (compliant) and Bad Records (violating) side-by-side; submit only unlocks when all records are clean
