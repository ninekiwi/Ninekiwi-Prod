import mongoose, { Schema, models, Model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string; // hashed
  role?: "user" | "admin";
  avatarUrl?: string;
  // password reset
  resetToken?: string | null;
  resetTokenExp?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },
    resetToken: { type: String, default: null },
    resetTokenExp: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema);
