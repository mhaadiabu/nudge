/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as cohorts from "../cohorts.js";
import type * as courses from "../courses.js";
import type * as experiments from "../experiments.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_assignment from "../lib/assignment.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_metrics from "../lib/metrics.js";
import type * as lib_nudgeLogic from "../lib/nudgeLogic.js";
import type * as lib_time from "../lib/time.js";
import type * as nudges from "../nudges.js";
import type * as portal from "../portal.js";
import type * as privateData from "../privateData.js";
import type * as profiles from "../profiles.js";
import type * as seed from "../seed.js";
import type * as sources from "../sources.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  assignments: typeof assignments;
  auth: typeof auth;
  cohorts: typeof cohorts;
  courses: typeof courses;
  experiments: typeof experiments;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/assignment": typeof lib_assignment;
  "lib/auth": typeof lib_auth;
  "lib/metrics": typeof lib_metrics;
  "lib/nudgeLogic": typeof lib_nudgeLogic;
  "lib/time": typeof lib_time;
  nudges: typeof nudges;
  portal: typeof portal;
  privateData: typeof privateData;
  profiles: typeof profiles;
  seed: typeof seed;
  sources: typeof sources;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
