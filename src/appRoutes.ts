import { Express } from "express";

import adminRouter from "./routes/api/admin";
import userRouter from "./routes/api/user/userRouter";
import jobRouter from "./routes/api/job";

export function registerAppRoutes(app: Express) {
  // routes
  app.use("/api/admin", adminRouter);
  app.use("/api/", userRouter);
  app.use("/api/", jobRouter);
}
