// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

if (
  !getEnv("CLOUDINARY_CLOUD_NAME") ||
  !getEnv("CLOUDINARY_API_KEY") ||
  !getEnv("CLOUDINARY_API_SECRET")
) {
  throw new Error("CLOUDINARY_* envs are missing");
}

cloudinary.config({
  cloud_name: getEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getEnv("CLOUDINARY_API_KEY"),
  api_secret: getEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

export { cloudinary };
