/**
 * Shared configuration for the Diga Activepieces piece.
 *
 * These values can be configured via environment variables in the Activepieces container.
 */

/**
 * The base URL for the Diga API.
 * Defaults to localhost:3000 for development.
 */
export const DIGA_API_URL =
  process.env["DIGA_API_URL"] || "http://localhost:3000";

/**
 * Shared secret for authenticating with Diga's internal AP endpoints.
 * Uses the same AP_JWT_SECRET as the backend for simplicity.
 */
export const DIGA_AP_SECRET = process.env["AP_JWT_SECRET"] ?? "";
