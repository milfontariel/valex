import { TransactionTypes } from "../repositories/cardRepository.js";
import * as companyRepository from "../repositories/companyRepository.js";
import * as employeeRepository from "../repositories/employeeRepository.js";
import * as cardRepository from "../repositories/cardRepository.js";
import * as rechargeRepository from "../repositories/rechargeRepository.js";
import * as paymentRepository from "../repositories/paymentRepository.js";
import * as businessRepository from "../repositories/businessRepository.js";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import "dotenv/config";

async function verifyIfCardTypeExist(
  employeeId: number,
  type: TransactionTypes
) {
  const existingCard = cardRepository.findByTypeAndEmployeeId(type, employeeId);
  return existingCard;
}

export async function create(
  employeeId: number,
  type: TransactionTypes,
  apiKey: string
) {
  const company: any = await companyRepository.findByApiKey(apiKey);
  if (!company) throw Error("Api-key inválida");

  const employee: any = await employeeRepository.findById(employeeId);
  if (!employee) throw Error("Empregado não cadastrado");

  const existingCard = await verifyIfCardTypeExist(employeeId, type);
  if (existingCard) throw Error("Card type already in use for that employee");

  const number: string = generateCardNumber();
  const cardholderName: string = nameFormatter(employee.fullName);
  const expirationDate: string = dateFormatter();
  const securityCode: string = generateCVC();
  return await cardRepository.insert({
    employeeId,
    number,
    cardholderName,
    securityCode,
    expirationDate,
    isVirtual: false,
    originalCardId: null,
    isBlocked: false,
    type,
  });
}

export async function activateCard(
  id: number,
  securityCode: string,
  password: string
) {
  const card = await getCard(id);
  verifyExpireDate(card.expirationDate);
  verifyPasswordExist(card.password);
  verifySecurityCode(card.securityCode, securityCode);
  validPassword(password);
  const encryptedPassword: string = encryptPassword(password);
  return await cardRepository.update(id, {
    ...card,
    password: encryptedPassword,
  });
}

export async function getBalance(id: number) {
  await getCard(id);
  const payments = await getpayments(id);
  const recharges = await getRecharges(id);
  const totalRecharges = getAmountRecharges(recharges);
  const totalPayments = getAmountPayments(payments);
  const balance = totalRecharges - totalPayments;
  return {
    balance,
    payments,
    recharges,
  };
}

export async function recharge(cardId: number, amount: number, apiKey: string) {
  const company: any = await companyRepository.findByApiKey(apiKey);
  if (!company) throw Error("Api-key inválida");

  const card = await getCard(cardId);
  verifyExpireDate(card.expirationDate);
  return await rechargeRepository.insert({ cardId, amount });
}

export async function payment(
  cardId: number,
  password: string,
  businessId: number,
  amount: number
) {
  const card = await getCard(cardId);
  verifyExpireDate(card.expirationDate);
  verifyPassword(card.password, password);
  const business = await getBusiness(businessId);
  await validTransaction(business, card, amount);
  return await paymentRepository.insert({ cardId, businessId, amount });
}

export async function validTransaction(
  business: any,
  card: any,
  amount: number
) {
  const payments = await getpayments(card.id);
  const recharges = await getRecharges(card.id);
  const totalRecharges = getAmountRecharges(recharges);
  const totalPayments = getAmountPayments(payments);
  const balance = totalRecharges - totalPayments;
  if (balance < amount)
    throw { erro_type: "bad_request", message: "Insufficient balance" };
  if (business.type !== card.type)
    throw {
      erro_type: "bad_request",
      message: "Business type differs from card type",
    };
  return;
}

export async function getBusiness(id: number) {
  const business = await businessRepository.findById(id);
  if (!business)
    throw { erro_type: "not_found_error", message: "Card not found" };
  return business;
}

export function generateCardNumber() {
  return faker.finance.creditCardNumber("mastercard");
}

export async function getCard(id: number) {
  const card = await cardRepository.findById(id);
  if (!card) throw { erro_type: "not_found_error", message: "Card not found" };
  return card;
}

export function nameFormatter(name: string) {
  const newNameArr = name.split(" ");
  let newNamehash = {};
  for (let i = 0; i < newNameArr.length; i++) {
    if (newNameArr[i].length < 3) continue;
    if (i !== 0 || i !== newNameArr.length - 1)
      newNamehash[newNameArr[i]] = newNameArr[i][0].toUpperCase();
    if (i === 0) newNamehash[newNameArr[i]] = newNameArr[i].toUpperCase();
    if (i === newNameArr.length - 1)
      newNamehash[newNameArr[i]] = newNameArr[i].toUpperCase();
  }
  name = Object.values(newNamehash).join(" ");
  return name;
}

export function dateFormatter() {
  return dayjs().add(5, "years").format("MM/YY");
}

export function generateCVC() {
  const cvc = faker.finance.creditCardCVV();
  console.log(cvc);
  return bcrypt.hashSync(cvc, 10);
}

export function verifyExpireDate(expirationDate: string) {
  const formatedExpirationDate = `${expirationDate.split("/")[0]}/01/${
    expirationDate.split("/")[1]
  }`;
  if (dayjs(formatedExpirationDate).isBefore(dayjs()))
    throw { erro_type: "bad_request", message: "Card is expired" };
  return;
}

export function verifyPasswordExist(password: string) {
  if (password !== null)
    throw { erro_type: "bad_request", message: "Card already activated" };
}

export function verifySecurityCode(
  securityCode: string,
  securityCodeUser: string
) {
  if (bcrypt.compareSync(securityCodeUser, securityCode)) return;
  throw { erro_type: "auth_error", message: "CVC is wrong" };
}
export function verifyPassword(password: string, passwordUser: string) {
  if (bcrypt.compareSync(passwordUser, password)) return;
  throw { erro_type: "auth_error", message: "password is wrong" };
}

export function validPassword(password: string) {
  const regex = /[0-9]{4}/;
  if (password.match(regex) === null)
    throw { erro_type: "bad_request", message: "Password should be 4 numbers" };
}

export function encryptPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export async function getpayments(id: number) {
  return await paymentRepository.findByCardId(id);
}

export async function getRecharges(id: number) {
  return await rechargeRepository.findByCardId(id);
}
export function getAmountRecharges(arr): number {
  return arr.reduce((total: number, item) => item.amount + total, 0);
}
export function getAmountPayments(arr): number {
  return arr.reduce((total: number, item) => item.amount + total, 0);
}
