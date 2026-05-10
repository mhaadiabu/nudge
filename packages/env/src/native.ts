import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CONVEX_URL: z.url(),
  EXPO_PUBLIC_CONVEX_SITE_URL: z.url(),
});

const fallbackEnv = {
  EXPO_PUBLIC_CONVEX_URL: "https://bright-bass-749.convex.cloud",
  EXPO_PUBLIC_CONVEX_SITE_URL: "https://bright-bass-749.convex.site",
};

const parsedEnv = envSchema.safeParse({
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CONVEX_SITE_URL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
});

export const env = parsedEnv.success ? parsedEnv.data : fallbackEnv;

export const envValidationError = parsedEnv.success
  ? null
  : parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
