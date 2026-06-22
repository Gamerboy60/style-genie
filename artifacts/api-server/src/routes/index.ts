import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clothingRouter from "./clothing";
import outfitsRouter from "./outfits";
import storageRouter from "./storage";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clothingRouter);
router.use(outfitsRouter);
router.use(storageRouter);
router.use(stripeRouter);

export default router;
