import mongoose, { Schema, models, Model } from "mongoose";

export interface IPhoto {
  reportId: string;
  section: string;
  name: string;
  src: string; // Cloudinary secure_url
  publicId: string; // Cloudinary public_id
  includeInSummary?: boolean;
  caption?: string;
  description?: string;
  figureNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    reportId: { type: String, required: true, index: true },
    section: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    src: { type: String, required: true },
    publicId: { type: String, required: true, index: true },
    includeInSummary: { type: Boolean, default: false },
    caption: { type: String },
    description: { type: String },
    figureNumber: { type: Number },
  },
  { timestamps: true }
);

export const Photo: Model<IPhoto> = models.Photo || mongoose.model<IPhoto>("Photo", PhotoSchema);

