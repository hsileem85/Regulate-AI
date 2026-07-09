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
