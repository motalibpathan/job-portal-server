import mongoose, { HydratedDocument } from "mongoose";
const Schema = mongoose.Schema;

export interface ITeamInviteModel {
  token: string;
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  usedBy?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export type ITeamInviteDocument = HydratedDocument<ITeamInviteModel>;

const teamInviteSchema = new Schema<ITeamInviteDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "companies",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

const TeamInvite = mongoose.model<ITeamInviteDocument>(
  "teamInvites",
  teamInviteSchema,
);

export default TeamInvite;
