import { Router, type IRouter } from "express";
import healthRouter from "./health";
import watchlistRouter from "./watchlist";
import portfolioRouter from "./portfolio";
import alertsRouter from "./alerts";
import marketRouter from "./market";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(watchlistRouter);
router.use(portfolioRouter);
router.use(alertsRouter);
router.use(marketRouter);
router.use(newsRouter);

export default router;
