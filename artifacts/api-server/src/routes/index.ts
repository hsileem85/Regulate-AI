import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import reportSchemaRouter from "./reportSchema";
import reportRulesRouter from "./reportRules";
import companiesRouter from "./companies";
import requestsRouter from "./requests";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(reportSchemaRouter);
router.use(reportRulesRouter);
router.use(companiesRouter);
router.use(requestsRouter);

export default router;
