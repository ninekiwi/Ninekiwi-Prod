import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  const MONGODB_URI = getEnv("MONGODB_URI") || "";
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Set it in your environment to enable database access.");
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: getEnv("MONGODB_DB") || undefined,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  global._mongoose = cached;
  return cached.conn;
}
