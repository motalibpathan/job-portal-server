import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import {
  billingCycles,
  companyPlans,
  subscriptionStatuses,
  TBillingCycle,
  TCompanyPlan,
  TSubscriptionStatus,
} from "../../../constants/jobEnums";
import Company from "../company/company";

export interface ISubscriptionModel {
  companyId: Types.ObjectId;
  plan: TCompanyPlan;
  billingCycle: TBillingCycle;
  amount: number;
  status: TSubscriptionStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionModel>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: Company,
      required: true,
    },
    plan: {
      type: String,
      enum: companyPlans,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: billingCycles,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: subscriptionStatuses,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

subscriptionSchema.index({ companyId: 1, createdAt: -1 });

export type ISubscriptionDocument = HydratedDocument<ISubscriptionModel>;

const Subscription = mongoose.model<ISubscriptionModel>(
  "subscriptions",
  subscriptionSchema,
);

export default Subscription;
