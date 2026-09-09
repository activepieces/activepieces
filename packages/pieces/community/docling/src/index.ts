import { createPiece, PieceAuth, PieceCategory } from "@activepieces/pieces-framework";
import { doclingAuth, authFromCtx, authKeyHeaders } from "./lib/auth.js";
import { DoclingError } from "./lib/errors.js";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { healthAction } from "./lib/actions/health.js";
import { convertFileAction } from "./lib/actions/convert-file.js";
import { convertUrlAction } from "./lib/actions/convert-url.js";
import { submitJobAction } from "./lib/actions/submit-job.js";
import { getResultAction } from "./lib/actions/get-result.js";
import { chunkAction } from "./lib/actions/chunk.js";

const DOC_LOGO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1e3a8a"/><path d="M14 10h14l8 8v20a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z" fill="#fff"/><path d="M28 10v8h8" fill="none" stroke="#1e3a8a" stroke-width="2"/><path d="M18 24h12M18 29h12M18 34h8" stroke="#1e3a8a" stroke-width="2"/></svg>`,
  );

const result = createPiece({
  displayName: "Docling",
  description:
    "Convert documents (PDF, DOCX, PPTX, images, HTML, …) to Markdown, docling-document JSON, HTML, DocTags and plain text via a docling-serve v1 API (self-hosted or Docling for IBM watsonx).",
  logoUrl: DOC_LOGO,
  authors: ["froid"],
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: doclingAuth,
  actions: [healthAction, convertFileAction, convertUrlAction, submitJobAction, getResultAction, chunkAction],
  triggers: [],
});

// The framework's `Piece` class is closed (all-readonly members, no
// `checkConnection` slot), so widen the created instance with the member
// the reactor's loader duck-types before attaching it below.
const docling = result as typeof result & {
  checkConnection: (ctx: unknown) => Promise<{ name: string }>;
};

// The Powerhouse workflow-runtime checkConnection subgraph predates the 2026
// framework's auth.validate convention and calls piece.checkConnection(ctx)
// with the shaped auth. This shim bridges the two: it performs the same
// /health check validate() does and reports the server version as the
// connection label. Harmless in real Activepieces (never called there).
docling.checkConnection = async (ctx: unknown) => {
  const { baseUrl, apiKey } = authFromCtx(ctx as { auth?: unknown });
  try {
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/health`,
      headers: authKeyHeaders(apiKey),
      timeout: 10_000,
      retries: 0,
    });
    if (res.status === 401) {
      throw new DoclingError("AUTH", "The API key was rejected by the server (401).");
    }
    if (res.status < 200 || res.status >= 300) {
      throw new DoclingError("JOB_FAILED", `docling-serve responded ${res.status}.`);
    }
    const version = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/version`,
      headers: authKeyHeaders(apiKey),
      timeout: 10_000,
      retries: 0,
    });
    // Real 1.32.0 uses the hyphenated key; the underscore spelling is a
    // defensive fallback for older builds.
    const body = version.body as Record<string, unknown>;
    const v = body["docling-serve"] ?? body.docling_serve;
    return { name: typeof v === "string" ? `docling-serve ${v}` : "docling-serve" };
  } catch (err) {
    if (err instanceof DoclingError) throw err;
    // R9 (same class as the T3 health.ts fix): the pinned pieces-common
    // 0.12.5 httpClient throws HttpError on any non-2xx — 401 included —
    // so the resolved-path 401 check above is unreachable; map the thrown
    // 401 to the AUTH kind here, mirroring doclingAuth.validate's catch.
    if (err !== null && typeof err === "object" && "status" in err && err.status === 401) {
      throw new DoclingError("AUTH", "The API key was rejected by the server (401).");
    }
    throw new DoclingError(
      "JOB_FAILED",
      `Could not reach docling-serve at ${baseUrl}. ${(err as Error)?.message ?? String(err)}`,
    );
  }
}; // The framework's Piece type has no checkConnection member — the shim is
   // typed through the widened declaration above rather than the brief's
   // `as never` (a block-bodied arrow cannot take an `as` suffix; the
   // esbuild bundle step rejects it). The reactor's loader duck-types it.

// The `PieceAuth` import above is used only to keep tooling happy if the
// stub ever needs PieceAuth.None(); remove if unused.
void PieceAuth;

export { docling };
export default docling;
