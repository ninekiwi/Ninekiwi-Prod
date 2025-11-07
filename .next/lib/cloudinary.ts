// lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

// Do NOT throw at import time — this breaks Next.js build when envs are not set
// (e.g., local dev without Cloudinary or static analysis in CI). Configure lazily.
const isCloudinaryConfigured = Boolean(
  getEnv("CLOUDINARY_CLOUD_NAME") &&
  getEnv("CLOUDINARY_API_KEY") &&
  getEnv("CLOUDINARY_API_SECRET")
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: getEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: getEnv("CLOUDINARY_API_KEY"),
    api_secret: getEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

export { cloudinary, isCloudinaryConfigured };
