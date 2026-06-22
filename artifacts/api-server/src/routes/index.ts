import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clothingRouter from "./clothing";
import outfitsRouter from "./outfits";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clothingRouter);
router.use(outfitsRouter);
router.use(storageRouter);

export default router;
