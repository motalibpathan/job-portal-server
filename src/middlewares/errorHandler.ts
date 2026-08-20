import { Request, Response, NextFunction } from "express";
import logger from "../util/winston";

export default (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(500).json({ message: "Server error" });
  logger.error(error);
  next(error);
};
