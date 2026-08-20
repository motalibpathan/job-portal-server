import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import {
  jobApplicationFieldTypes,
  jobEmploymentTypes,
  jobRemoteOptions,
  jobStatuses,
  TJobApplicationFieldType,
  TJobEmploymentType,
  TJobRemoteOption,
  TJobStatus,
} from "../../../constants/jobEnums";
import Company from "../company/company";
import JobCategory from "../jobCategory/jobCategory";

export interface IJobCategoryInJob {
  categoryId: Types.ObjectId;
  categoryName: string;
}

export interface IApplicationFormField {
  fieldId: string;
  label: string;
  fieldType: TJobApplicationFieldType;
  required: boolean;
  order: number;
}

export interface IHiringStage {
  stageId: string;
  name: string;
  order: number;
}

export interface IJobModel {
  title: string;
  slug: string;
  companyId: Types.ObjectId;
  category: IJobCategoryInJob;
  description: string;
  country: string;
  remoteOption: TJobRemoteOption;
  employmentType: TJobEmploymentType;
  applicationForm: IApplicationFormField[];
  stages: IHiringStage[];
  status: TJobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_HIRING_STAGES: IHiringStage[] = [
  { stageId: "applied", name: "Applied", order: 1 },
  { stageId: "screening", name: "Screening", order: 2 },
  { stageId: "interview", name: "Interview", order: 3 },
  { stageId: "evaluation", name: "Evaluation", order: 4 },
  { stageId: "offer", name: "Offer", order: 5 },
  { stageId: "hired", name: "Hired", order: 6 },
  { stageId: "archive", name: "Archive", order: 7 },
];

const jobCategorySchema = new Schema<IJobCategoryInJob>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: JobCategory,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const applicationFormFieldSchema = new Schema<IApplicationFormField>(
  {
    fieldId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    fieldType: {
      type: String,
      required: true,
      enum: jobApplicationFieldTypes,
    },
    required: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const hiringStageSchema = new Schema<IHiringStage>(
  {
    stageId: {
      type: String,
      required: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const jobSchema = new Schema<IJobModel>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: Company,
      required: true,
    },
    category: {
      type: jobCategorySchema,
      required: true,
    },
    description: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    remoteOption: { type: String, required: true, enum: jobRemoteOptions },
    employmentType: { type: String, required: true, enum: jobEmploymentTypes },
    applicationForm: {
      type: [applicationFormFieldSchema],
      default: [],
    },
    stages: {
      type: [hiringStageSchema],
      default: () => DEFAULT_HIRING_STAGES,
    },
    status: {
      type: String,
      enum: jobStatuses,
      default: "active",
    },
  },
  { timestamps: true },
);

jobSchema.index({ companyId: 1, createdAt: -1 });
jobSchema.index({ companyId: 1, slug: 1 }, { unique: true });
jobSchema.index({
  "category.categoryId": 1,
  country: 1,
  employmentType: 1,
  remoteOption: 1,
});

export type IJobDocument = HydratedDocument<IJobModel>;

const Job = mongoose.model<IJobModel>("jobs", jobSchema);

export default Job;
