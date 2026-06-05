import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL || "http://localhost:8081";
const nativeAppUrl = process.env.NATIVE_APP_URL || "nudge://";
const ALLOWED_DOMAIN = "upsamail.edu.gh";

export const authComponent = createClient<DataModel>(components.betterAuth);

export function inferRoleFromEmail(
  email: string,
): Array<"student" | "lecturer" | "classRep" | "departmentAdmin" | "researcher"> {
  const localPart = email.toLowerCase().split("@")[0] ?? "";
  const isNumericStudent = /^\d{8}$/.test(localPart);
  if (isNumericStudent) {
    return ["student"];
  }
  if (localPart.includes("researcher") || localPart.includes("research")) return ["researcher"];
  if (localPart.includes("department") || localPart.includes("dept") || localPart.includes("admin"))
    return ["departmentAdmin"];
  if (localPart.includes("lecturer") || localPart.includes("tutor")) return ["lecturer"];
  if (
    localPart.includes("classrep") ||
    localPart.includes("class.rep") ||
    localPart.includes("rep")
  )
    return ["classRep", "student"];
  return ["student"];
}

export function extractStudentIdFromEmail(email: string): string | undefined {
  const localPart = email.toLowerCase().split("@")[0] ?? "";
  if (/^\d{8}$/.test(localPart)) {
    return `UPSA-${localPart}`;
  }
  return undefined;
}

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    trustedOrigins: [siteUrl, nativeAppUrl, "exp://", "exp://**"],
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      expo(),
      crossDomain({ siteUrl }),
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
    hooks: {
      async afterCreateUser(user) {
        const email = (user.email ?? "").toLowerCase();
        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          throw new Error(`Only @${ALLOWED_DOMAIN} emails are allowed.`);
        }
      },
    },
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
