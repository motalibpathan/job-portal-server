import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import Company from "../company/company";

export interface IJobCategoryModel {
  name: string;
  companyId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IJobCategoryDocument = HydratedDocument<IJobCategoryModel>;

const jobCategorySchema = new Schema<IJobCategoryModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: Company,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

jobCategorySchema.index({ companyId: 1, name: 1 }, { unique: true });

const JobCategory = mongoose.model<IJobCategoryModel>(
  "jobCategories",
  jobCategorySchema,
);

export default JobCategory;
