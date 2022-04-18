import { Request, Response, NextFunction } from "express";

export default function handleErrors(error, req: Request, res: Response, next: NextFunction){
    if(error) {
        if (error.erro_type === "invalid_entity") return res.status(422).send(error.message);
        if (error.erro_type === "auth_error") return res.status(401).send(error.message);
        if (error.erro_type === "not_found_error") return res.status(404).send(error.message);
        if (error.erro_type === "conflict_error") return res.status(409).send(error.message);
        return res.sendStatus(500);
    }
}