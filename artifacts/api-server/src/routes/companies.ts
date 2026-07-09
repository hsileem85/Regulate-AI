import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, companiesTable } from "@workspace/db";
import {
  CreateCompanyBody,
  GetCompanyParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// List companies
router.get("/companies", async (req, res): Promise<void> => {
  const { domain } = req.query as { domain?: string };

  let companies = await db.select().from(companiesTable).orderBy(companiesTable.name);

  if (domain) {
    companies = companies.filter((c) => c.domain === domain);
  }

  res.json(companies.map(formatCompany));
});

// Create company
router.post("/companies", async (req, res): Promise<void> => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [company] = await db.insert(companiesTable).values({
    name: parsed.data.name,
    domain: parsed.data.domain,
    email: parsed.data.email,
    contactPerson: parsed.data.contactPerson,
  }).returning();

  res.status(201).json(formatCompany(company));
});

// Get company
router.get("/companies/:id", async (req, res): Promise<void> => {
  const params = GetCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, params.data.id));
  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(formatCompany(company));
});

function formatCompany(c: typeof companiesTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
  };
}

export default router;
