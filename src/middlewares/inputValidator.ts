import { NextFunction, Request, Response } from "express";
import { Schema } from "yup";
import { z } from "zod";

export default (validator: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { errors, isValid } = validator(req.body, req.params, req.query);
    if (!isValid) {
      return res.status(400).json({
        ...errors,
      });
    }
    next();
  };
};

// returns the first validation error in "message" field
// easier for front end to show error
export const flatYupInputValidator = (
  bodySchema?: Schema<any> | null,
  paramsSchema?: Schema<any> | null,
  querySchema?: Schema<any> | null,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (bodySchema) {
        await bodySchema.validate(req.body, { abortEarly: true });
      }
      if (paramsSchema) {
        await paramsSchema.validate(req.params, { abortEarly: true });
      }
      if (querySchema) {
        await querySchema.validate(req.query, { abortEarly: true });
      }
      next();
    } catch (error: any) {
      const err = { message: "Please provide valid inputs" };
      if (error?.errors?.length) {
        if (error.path) {
          err[error.path] = error.errors[0];
        }
        err.message = error.errors[0];
      }
      res.status(400).json(err);
    }
  };
};

export const flatZodInputValidator = (
  bodySchema?: z.ZodType | null,
  paramsSchema?: z.ZodType | null,
  querySchema?: z.ZodType | null,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (bodySchema) {
        req.body = await bodySchema.parse(req.body);
      }

      if (paramsSchema) {
        req.params = (await paramsSchema.parse(req.params)) as Record<
          string,
          string
        >;
      }

      if (querySchema) {
        req.query = (await querySchema.parse(req.query)) as Record<
          string,
          string
        >;
      }

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.reduce(
          (acc: Record<string, string>, cur: z.core.$ZodIssue) => {
            const key = cur.path.join(".");
            acc[key] = cur.message;
            return acc;
          },
          {},
        );

        return res.status(400).json({
          message: error.issues.length
            ? error.issues[0].message
            : "Please provide valid inputs",
          ...formattedErrors,
        });
      }

      return res.status(400).json({
        message: "Please provide valid inputs",
      });
    }
  };
};
