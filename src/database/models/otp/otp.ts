import mongoose, { HydratedDocument, Schema } from "mongoose";
import { otpTypes, TOtpTypes } from "../../../constants/smsEnums";

export interface IOTPModel {
  type: TOtpTypes;
  identifier: string;
  otp: string;
  createdAt: Date;
}

// Create Schema
const OtpSchema = new Schema<IOTPModel>({
  type: {
    type: String,
    required: true,
    enum: otpTypes,
  },
  identifier: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 160,
  },
});

export type IOtpDocument = HydratedDocument<IOTPModel>;
const Otp = mongoose.model<IOTPModel>("otp", OtpSchema);

export default Otp;
