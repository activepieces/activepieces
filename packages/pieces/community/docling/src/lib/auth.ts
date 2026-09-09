import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DoclingError } from "./errors.js";

export const DOCLING_DEFAULT_BASE_URL = "http://localhost:5001";

export function normalizeBaseUrl(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return DOCLING_DEFAULT_BASE_URL;
  return v.replace(/\/+$/, "");
}

export function authKeyHeaders(apiKey?: string): Record<string, string> {
  return apiKey ? { "x-api-key": apiKey } : {};
}

export const doclingAuth = PieceAuth.CustomAuth({
  displayName: "Docling Serve",
  description:
    "A docling-serve v1 API server — self-hosted, or Docling for IBM watsonx (same API).",
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: "Service URL",
      required: true,
      defaultValue: DOCLING_DEFAULT_BASE_URL,
      description:
        "Base URL of the docling-serve instance, e.g. http://localhost:5001 — or your Docling-for-IBM-watsonx service URL.",
    }),
    // SecretTextProperty is a zod schema value in 0.32.0, not a factory —
    // the factory form is PieceAuth.SecretText.
    api_key: PieceAuth.SecretText({
      displayName: "API Key",
      required: false,
      description:
        "The server's DOCLING_SERVE_API_KEY value, sent as the X-Api-Key header. Leave empty for an unauthenticated local server.",
    }),
  },
  // 0.32.0 passes the FLAT property value here ({ base_url, api_key }) —
  // the shaped { type, props } object only exists on runtime ctx.auth.
  validate: async ({ auth }) => {
    const base = normalizeBaseUrl(auth.base_url);
    try {
      const res = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${base}/health`,
        headers: authKeyHeaders(typeof auth.api_key === "string" ? auth.api_key : undefined),
        timeout: 10_000,
        retries: 0,
      });
      if (res.status === 401) {
        return { valid: false, error: "The API key was rejected by the server (401)." };
      }
      if (res.status < 200 || res.status >= 300) {
        return { valid: false, error: `Server responded ${res.status}.` };
      }
      return { valid: true };
    } catch (err) {
      // Thrown 4xx/5xx surface as pieces-common HttpError carrying .status;
      // narrow with `in`/instanceof instead of casting the unknown error.
      if (err !== null && typeof err === "object" && "status" in err && err.status === 401) {
        return { valid: false, error: "The API key was rejected by the server (401)." };
      }
      const detail = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        error: `Could not reach docling-serve at ${base}. ${detail}`,
      };
    }
  },
});

// Reads the shaped connection value (AP: ctx.auth; reactor: shapeAuthValue's
// CUSTOM_AUTH value) into a plain pair. Both runtimes produce
// { type: "CUSTOM_AUTH", props: { base_url, api_key } }.
export function authFromCtx(ctx: { auth?: unknown }): { baseUrl: string; apiKey?: string } {
  // Narrow the runtime-shaped { type, props } value with in/typeof (no cast),
  // then read the two fields both runtimes put in .props.
  const auth = ctx.auth;
  let props: Record<string, unknown> = {};
  if (
    auth !== null &&
    typeof auth === "object" &&
    "props" in auth &&
    auth.props !== null &&
    typeof auth.props === "object"
  ) {
    // structurally a plain name -> value map
    props = auth.props as Record<string, unknown>;
  }
  const key = props.api_key;
  return {
    baseUrl: normalizeBaseUrl(props.base_url),
    apiKey: typeof key === "string" && key.length > 0 ? key : undefined,
  };
}

export { DoclingError };
