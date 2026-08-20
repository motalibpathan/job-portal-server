import mongoose, { HydratedDocument, Schema, Types } from "mongoose";
import {
  JOB_APPLICATION_STATUSES,
  jobApplicationStatuses,
  TJobApplicationStatus,
} from "../../../constants/jobEnums";
import Job from "../job/job";
import User from "../user/user";

export interface IJobApplicationAnswer {
  fieldId: string;
  value: string;
}

export interface IJobApplicationModel {
  jobId: Types.ObjectId;
  applicantId?: Types.ObjectId;
  answers: IJobApplicationAnswer[];
  status: TJobApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const jobApplicationAnswerSchema = new Schema<IJobApplicationAnswer>(
  {
    fieldId: { type: String, required: true, trim: true },
    // For document-upload fields, value is the URL returned after file upload.
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const jobApplicationSchema = new Schema<IJobApplicationModel>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: Job,
      required: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    answers: {
      type: [jobApplicationAnswerSchema],
      required: true,
    },
    status: {
      type: String,
      enum: jobApplicationStatuses,
      default: JOB_APPLICATION_STATUSES.SUBMITTED,
      required: true,
    },
  },
  { timestamps: true },
);

jobApplicationSchema.index({ jobId: 1, createdAt: -1 });
jobApplicationSchema.index({ applicantId: 1, createdAt: -1 });

export type IJobApplicationDocument = HydratedDocument<IJobApplicationModel>;

const JobApplication = mongoose.model<IJobApplicationModel>(
  "jobApplications",
  jobApplicationSchema,
);

export default JobApplication;
