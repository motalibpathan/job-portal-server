import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface ICompanyModel {
  name: string;
  userName: string;
  creatorUserId: mongoose.Types.ObjectId;
  teamMemberUserIds: mongoose.Types.ObjectId[];
  logoUrl?: string;
  description?: string;
  websiteUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ICompanyDocument = mongoose.HydratedDocument<ICompanyModel>;

const companySchema = new Schema<ICompanyDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    creatorUserId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    teamMemberUserIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    logoUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    websiteUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model<ICompanyDocument>("companies", companySchema);

export default Company;
