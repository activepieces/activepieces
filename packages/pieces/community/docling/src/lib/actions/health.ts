import { createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { doclingAuth, authFromCtx, authKeyHeaders } from "../auth.js";
import { DoclingError } from "../errors.js";
import { healthOutputFields } from "../output-schemas.js";

export const healthAction = createAction({
  auth: doclingAuth,
  name: "health",
  displayName: "Check Health",
  description:
    "Checks the docling-serve connection (GET /health and /version). Use as a pre-flight step.",
  audience: "both",
  aiMetadata: {
    description: "Verifies the docling-serve endpoint is reachable and returns its component versions.",
    idempotent: true,
  },
  outputSchema: { fields: healthOutputFields },
  props: {},
  run: async (ctx) => {
    const { baseUrl, apiKey } = authFromCtx(ctx);
    const h = authKeyHeaders(apiKey);
    // R8: the pinned pieces-common 0.12.5 httpClient rejects non-2xx with an
    // HttpError carrying an own `status` (axios default validateStatus), so
    // each call maps its raw throw to a typed DoclingError here — the
    // pre-client-core path, mirroring doclingAuth.validate's catch.
    let healthRes: { status: number; body: unknown };
    try {
      healthRes = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/health`,
        headers: h,
        timeout: 10_000,
        retries: 0,
      });
    } catch (err) {
      if (err !== null && typeof err === "object" && "status" in err && err.status === 401) {
        throw new DoclingError(
          "AUTH",
          "docling-serve rejected the API key (401). Check the connection's API key against the server's DOCLING_SERVE_API_KEY.",
        );
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new DoclingError("JOB_FAILED", `Could not reach docling-serve at ${baseUrl} — ${detail}`);
    }
    if (healthRes.status === 401) {
      throw new DoclingError(
        "AUTH",
        "docling-serve rejected the API key (401). Check the connection's API key against the server's DOCLING_SERVE_API_KEY.",
      );
    }
    if (healthRes.status < 200 || healthRes.status >= 300) {
      throw new DoclingError("JOB_FAILED", `docling-serve /health responded ${healthRes.status}.`);
    }
    let versionRes: { status: number; body: unknown };
    try {
      versionRes = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/version`,
        headers: h,
        timeout: 10_000,
        retries: 0,
      });
    } catch (err) {
      if (err !== null && typeof err === "object" && "status" in err && err.status === 401) {
        throw new DoclingError(
          "AUTH",
          "docling-serve rejected the API key (401). Check the connection's API key against the server's DOCLING_SERVE_API_KEY.",
        );
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new DoclingError("JOB_FAILED", `Could not reach docling-serve at ${baseUrl} — ${detail}`);
    }
    // The http client JSON-parses bodies; /health is { status }, /version is
    // a flat name -> version map. Narrowed, not blindly cast, before use.
    let status = "ok";
    if (
      healthRes.body !== null &&
      typeof healthRes.body === "object" &&
      "status" in healthRes.body &&
      typeof healthRes.body.status === "string"
    ) {
      status = healthRes.body.status;
    }
    let versions: Record<string, unknown> = {};
    if (versionRes.body !== null && typeof versionRes.body === "object") {
      // structurally a flat name -> version map
      versions = versionRes.body as Record<string, unknown>;
    }
    return {
      status,
      versions,
    };
  },
});
