import "express-async-errors";
import dotenv from "dotenv";
import cors from "cors";
import express, {json, Request, Response, NextFunction} from "express";
import router from "./routes/routes.js";

dotenv.config();

const server = express();

server.use(cors());
server.use(json());
server.use(router);
server.use((error : any, req : Request, res : Response, next : NextFunction) => {
    if (error.erro_type === "invalid_entity") return res.status(422).send(error.message);
    if (error.erro_type === "auth_error") return res.status(401).send(error.message);
    if (error.erro_type === "not_found_error") return res.status(404).send(error.message);
    if (error.erro_type === "conflict_error") return res.status(409).send(error.message);
    return res.sendStatus(500);
  })

const PORT = process.env.PORT || 5000;
server.listen(PORT);