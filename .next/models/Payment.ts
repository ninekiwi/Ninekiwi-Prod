import mongoose, { Schema, models, Model } from "mongoose";

export interface IPayment {
  orderId: string;
  paymentId: string;
  signature: string;
  amount: number; // store major units as provided by client
  currency: string;
  description?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string; // success / failed
  meta?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    signature: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    description: { type: String },
    name: { type: String },
    email: { type: String, lowercase: true, index: true },
    phone: { type: String },
    status: { type: String, default: "success" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> = models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

