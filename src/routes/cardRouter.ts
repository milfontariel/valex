import { Router } from "express";
import * as cardController from "../controllers/cardController.js";

const cardRouter = Router();

cardRouter.post("/card/create", cardController.createCard);
cardRouter.post("/card/:id/activate", cardController.activateCard);
cardRouter.get("/card/:id", cardController.getCardBalance);
cardRouter.post("/card/:id/recharge", cardController.rechargeCard);
cardRouter.post("/card/:id/payment/:idBusiness", cardController.postPayment);
export default cardRouter;