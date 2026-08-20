import { Request, Response, NextFunction } from "express";

const blacklist = ["35.240.84.96"];

export function ipChecker() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    if (ip && blacklist.includes(ip)) {
      return res.status(403).send("Unauthorized");
    }
    next();
  };
}
