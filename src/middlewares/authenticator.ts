import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Socket } from "socket.io";
import Admin from "../database/models/admin/admin";
import Company from "../database/models/company/company";
import User from "../database/models/user/user";
import config from "../settings/config";

export interface IUserTokenData {
  type: "user";
  userId: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export interface IAdminTokenData {
  type: "admin";
  adminId: mongoose.Types.ObjectId;
  username: string;
  level: number;
}

// Auth levels:
//  "user"        — company owner. If :companyIdOrUsername is in the route,
//                  automatically verifies ownership and attaches req.company.
//  "min-admin"   — platform admin (level 0 or 1). No company check.
//  "super-admin" — platform owner only (level 0). No company check.
export type TAuthLevel = "user" | "min-admin" | "super-admin";

export function socketAuthError() {
  const err: any = new Error("Authentication error");
  return err;
}

export function sendUnauthorized(
  res?: Response,
  socket?: Socket,
  next?: (err?: any) => void,
) {
  if (res) return res.status(401).send("Unauthorized");
  if (socket && next) return next(socketAuthError());
  return;
}

async function authProcessor(
  levels: TAuthLevel[],
  token: string,
  req: Request | undefined,
  socket: Socket | undefined,
): Promise<401 | 200> {
  try {
    const tokenData: any = jwt.decode(token);
    if (!tokenData || !tokenData.type) return 401;

    const { type } = tokenData;

    // ── Admin (platform owner) ─────────────────────────────
    // Admins bypass any company check entirely.
    if (type === "admin") {
      const verified = jwt.verify(token, config.ADMIN_SECRET);
      if (!verified) return 401;

      const admin = await Admin.findOne({ _id: tokenData.adminId });
      if (!admin) return 401;

      if (levels.includes("super-admin")) {
        if (admin.level !== 0) return 401;
      } else if (levels.includes("min-admin")) {
        if (admin.level >= 2) return 401;
      } else {
        return 401;
      }

      if (req) req.admin = admin;
      if (socket) socket.admin = admin;

    // ── User (company owner) ───────────────────────────────
    } else if (levels.includes("user") && type === "user") {
      const verified = jwt.verify(token, config.CLIENT_SECRET);
      if (!verified) return 401;

      const user = await User.findOne({ _id: tokenData.userId });
      if (!user) return 401;

      // If the route has :companyIdOrUsername, automatically verify that
      // this user owns that company and attach it to the request.
      const companyIdOrUsername =
        req?.params.companyIdOrUsername ||
        (socket?.handshake.query.companyIdOrUsername as string | undefined);

      if (companyIdOrUsername) {
        const isObjectId = mongoose.isObjectIdOrHexString(companyIdOrUsername);
        const company = await Company.findOne(
          isObjectId
            ? { _id: companyIdOrUsername }
            : { userName: companyIdOrUsername },
        );

        if (!company) return 401;

        const isOwner = company.creatorUserId.equals(user._id);
        const isMember = company.teamMemberUserIds.some((id: mongoose.Types.ObjectId) =>
          id.equals(user._id),
        );
        if (!isOwner && !isMember) return 401;

        if (req) req.company = company;
        if (socket) socket.company = company;
      }

      if (req) req.user = user;
      if (socket) socket.user = user;

    } else {
      return 401;
    }

    return 200;
  } catch {
    return 401;
  }
}

export function authenticator(levels: TAuthLevel[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authToken = req.headers["authorization"] as string;
      if (!authToken) return res.status(401).send("Unauthorized");

      // Expect "JWT <token>" or "Bearer <token>"
      const token = authToken.split(" ")[1];
      if (!token) return res.status(401).send("Unauthorized");

      const status = await authProcessor(levels, token, req, undefined);
      if (status === 401) return sendUnauthorized(res);

      next();
    } catch {
      return res.status(401).send("Unauthorized");
    }
  };
}

export function socketAuthenticator(levels: TAuthLevel[]) {
  return async (socket: Socket, next: (err?: any) => void) => {
    try {
      const authToken = (socket.request.headers.authorization ||
        socket.handshake.query.refreshToken) as string;
      if (!authToken) return next(new Error("Authentication error"));

      const token = authToken.split(" ")[1];
      if (!token) return next(socketAuthError());

      const status = await authProcessor(levels, token, undefined, socket);
      if (status === 401) return sendUnauthorized(undefined, socket, next);

      next();
    } catch {
      return next(socketAuthError());
    }
  };
}
