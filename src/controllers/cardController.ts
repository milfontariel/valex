import { Request, Response } from "express";
import * as cardService from "../services/cardServices.js";

export async function createCard(req: Request, res: Response) {
  const typesOfCard = {
    groceries: true,
    restaurant: true,
    transport: true,
    education: true,
    health: true,
  };
  const apiKey: string = req.headers["x-api-key"].toString();
  const { employeeId, type } = req.body;
  if (!typesOfCard[type]) {
    return res.status(409).send("Tipo de cartão inválido");
  }
  await cardService.create(parseInt(employeeId), type, apiKey);
  res.sendStatus(201);
}

export async function activateCard(req: Request, res: Response) {
  const { id } = req.params;
  const { securityCode, password } = req.body;
  const idNumber: number = parseInt(id);

  await cardService.activateCard(idNumber, securityCode, password);
  res.sendStatus(200);
}

export async function getCardBalance(req: Request, res: Response) {
  const { id } = req.params;
  const idNumber: number = parseInt(id);
  res.send(await cardService.getBalance(idNumber));
}

export async function rechargeCard(req: Request, res: Response) {
  const { id } = req.params;
  const { amount } = req.body;
  if (parseInt(amount) <= 0)
    return res.status(400).send("Valor não pode ser 0.");
  const apiKey = req.headers["x-api-key"].toString();
  const idNumber: number = parseInt(id);
  await cardService.recharge(idNumber, amount, apiKey);
  res.sendStatus(201);
}

export async function postPayment(req: Request, res: Response) {
  const { id, idBusiness } = req.params;
  const { password } = req.body;
  const amount = parseInt(req.body.amount);
  const idNumber: number = parseInt(id);
  const idNumberBusiness: number = parseInt(idBusiness);
  await cardService.payment(idNumber, password, idNumberBusiness, amount);
  res.sendStatus(200);
}
