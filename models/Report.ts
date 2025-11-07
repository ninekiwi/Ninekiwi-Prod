import mongoose, { Schema, models, Model } from "mongoose";

export interface IReportDoc {
  userId: string; // from session token.id
  reportId: string; // user-provided id, unique per user
  status?: string;
  data: Record<string, any>; // full form snapshot
  signatureData?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema = new Schema<IReportDoc>(
  {
    userId: { type: String, required: true, index: true },
    reportId: { type: String, required: true },
    status: { type: String },
    data: { type: Schema.Types.Mixed, required: true },
    signatureData: { type: String, default: null },
  },
  { timestamps: true }
);

ReportSchema.index({ userId: 1, reportId: 1 }, { unique: true });

export const Report: Model<IReportDoc> = models.Report || mongoose.model<IReportDoc>("Report", ReportSchema);

