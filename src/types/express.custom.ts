/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { IAdminDocument } from "../database/models/admin/admin";
import { ICompanyDocument } from "../database/models/company/company";
import { IUserDocument } from "../database/models/user/user";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      admin?: IAdminDocument;
      company?: ICompanyDocument;
    }
  }
}

declare module "socket.io" {
  interface Socket {
    user?: IUserDocument;
    admin?: IAdminDocument;
    company?: ICompanyDocument;
  }
}
