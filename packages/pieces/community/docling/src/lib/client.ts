import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DoclingError } from "./errors.js";
import type { ConvertDocumentsOptionsPayload } from "./options.js";

export interface DoclingAuth { baseUrl: string; apiKey?: string; }
export type DoclingSource =
  | { kind: "file"; filename: string; base64: string }
  | { kind: "http"; url: string };

export interface ConvertDocumentResponse {
  document: {
    filename?: string | null;
    md_content?: string | null;
    json_content?: unknown;
    html_content?: string | null;
    text_content?: string | null;
    doctags_content?: string | null;
  } | null;
  status: "success" | "partial_success" | "skipped" | "failure";
  errors?: Array<Record<string, unknown>>;
  processing_time?: number;
}

export interface TaskStatusResponse {
  task_id: string;
  task_type?: string;
  task_status: "pending" | "started" | "success" | "failure" | "partial_success" | "skipped";
  task_position?: number | null;
  task_meta?: unknown;
  error_message?: string | null;
  failure?: { category?: string; message?: string; retryable?: boolean; phase?: string } | null;
}

export interface ChunkResult { chunks: unknown[]; processing_time?: number; }

export interface RunConversionArgs {
  auth: DoclingAuth;
  source: DoclingSource;
  options: ConvertDocumentsOptionsPayload;
  mode: "async" | "sync";
  timeoutMs: number;
  path: "convert" | "chunk";
  chunker?: "hybrid" | "hierarchical";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function headers(apiKey?: string): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) h["x-api-key"] = apiKey;
  return h;
}

function url(auth: DoclingAuth, path: string, query?: Record<string, string | number>): string {
  const u = new URL(path, `${auth.baseUrl}/`);
  if (query) for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return u.toString();
}

function endpointPath(args: Pick<RunConversionArgs, "path" | "chunker">, async: boolean): string {
  const base = args.path === "chunk" ? `/v1/chunk/${args.chunker ?? "hybrid"}/source` : "/v1/convert/source";
  return async ? `${base}/async` : base;
}

function sourceBody(source: DoclingSource): Array<Record<string, unknown>> {
  return [source.kind === "file"
    ? { kind: "file", base64_string: source.base64, filename: source.filename }
    : { kind: "http", url: source.url }];
}

// --- error mapping -----------------------------------------------------------
// pieces-common's AxiosHttpClient throws an HttpError with OWN props
// [status, responseBody, …] and a JSON `message` (spike S6a); timeouts surface
// as DOMException AbortError (code 20). Map both to typed DoclingError.

function mapHttpStatus(status: number, detail: unknown): DoclingError {
  const text = typeof detail === "string"
    ? detail
    : (() => { try { return JSON.stringify(detail); } catch { return String(detail); } })();
  const short = (text ?? "").slice(0, 300);
  switch (status) {
    case 401:
      return new DoclingError("AUTH", "docling-serve rejected the API key (401). Check the connection's key against the server's DOCLING_SERVE_API_KEY.");
    case 422:
      return new DoclingError("VALIDATION", `docling-serve rejected the request (422): ${short}`);
    case 404:
      return new DoclingError("VALIDATION", `docling-serve: unknown endpoint or task (404): ${short}`);
    case 504:
      return new DoclingError("SYNC_TIMEOUT", "Conversion exceeded the server's sync limit (504). Re-run with execution mode “auto (async)”, or raise the server's DOCLING_SERVE_MAX_SYNC_WAIT.");
    case 429:
    case 503:
      return new DoclingError("OVERLOADED", `docling-serve is busy (HTTP ${status}).`, true);
    default:
      return new DoclingError("JOB_FAILED", `docling-serve error ${status}: ${short}`, status >= 500);
  }
}

function mapError(err: unknown): DoclingError {
  if (err instanceof DoclingError) return err;
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number") {
    return mapHttpStatus(status, (err as { responseBody?: unknown }).responseBody);
  }
  if ((err as { name?: unknown })?.name === "AbortError" || (err as { code?: unknown })?.code === 20) {
    return new DoclingError("OVERLOADED", "The request to docling-serve timed out.", true);
  }
  return new DoclingError("JOB_FAILED", `Unexpected error calling docling-serve: ${(err as Error)?.message ?? String(err)}`);
}

async function send<T>(
  method: HttpMethod,
  fullUrl: string,
  body: unknown,
  apiKey: string | undefined,
  timeoutMs: number,
): Promise<{ status: number; body: T; headers: Record<string, string | string[]> }> {
  try {
    const res = await httpClient.sendRequest({
      method,
      url: fullUrl,
      body: body === undefined ? undefined : (body as never),
      headers: headers(apiKey),
      timeout: timeoutMs,
      retries: 0,
    });
    if (res.status >= 400) throw mapHttpStatus(res.status, res.body);
    return { status: res.status, body: res.body as T, headers: (res.headers ?? {}) as Record<string, string | string[]> };
  } catch (err) {
    throw mapError(err);
  }
}

// 429/503 retry wrapper: honors Retry-After, exponential backoff capped at
// 15 s, at most `retries` attempts. Only OVERLOADED errors retry.
async function withBackoff<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof DoclingError) || err.kind !== "OVERLOADED" || attempt >= retries) throw err;
      attempt++;
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 15_000));
    }
  }
}

// NOTE on Retry-After: send() currently surfaces it only through the
// OVERLOADED mapping; honoring the exact header value is a v1.1 refinement
// (the mock uses Retry-After: 0, so plain backoff covers the tests).

// --- submit / poll / result ---------------------------------------------------

export async function submitJob(args: {
  auth: DoclingAuth;
  source: DoclingSource;
  options: ConvertDocumentsOptionsPayload;
  path?: "convert" | "chunk";
  chunker?: "hybrid" | "hierarchical";
}): Promise<TaskStatusResponse> {
  const path = args.path ?? "convert";
  const body = {
    sources: sourceBody(args.source),
    options: args.options,
    target: { kind: "inbody" },
  };
  const res = await withBackoff(() =>
    send<TaskStatusResponse>(
      HttpMethod.POST,
      url(args.auth, endpointPath({ path, chunker: args.chunker }, true)),
      body,
      args.auth.apiKey,
      30_000,
    ),
  );
  if (!res.body.task_id) {
    throw new DoclingError("VALIDATION", `Server accepted the job but returned no task_id: ${JSON.stringify(res.body).slice(0, 200)}`);
  }
  if (res.body.task_status === "failure") {
    throw new DoclingError("JOB_FAILED", jobFailureMessage(res.body), res.body.failure?.retryable ?? false);
  }
  return res.body;
}

export async function pollTask(auth: DoclingAuth, taskId: string, waitSeconds = 5): Promise<TaskStatusResponse> {
  const res = await withBackoff(() =>
    send<TaskStatusResponse>(
      HttpMethod.GET,
      url(auth, `/v1/status/poll/${taskId}`, { wait: waitSeconds }),
      undefined,
      auth.apiKey,
      30_000,
    ),
  );
  return res.body;
}

export async function fetchResult(
  auth: DoclingAuth,
  taskId: string,
): Promise<ConvertDocumentResponse | ChunkResult | { failure: NonNullable<TaskStatusResponse["failure"]> }> {
  const res = await withBackoff(() =>
    send<ConvertDocumentResponse | ChunkResult | { failure: NonNullable<TaskStatusResponse["failure"]> }>(
      HttpMethod.GET,
      url(auth, `/v1/result/${taskId}`),
      undefined,
      auth.apiKey,
      30_000,
    ),
  );
  return res.body;
}

function jobFailureMessage(t: TaskStatusResponse): string {
  const f = t.failure;
  if (f?.message) return `docling job failed [${f.category ?? "unknown"}${f.phase ? `, ${f.phase}` : ""}]: ${f.message}`;
  return `docling job failed: ${t.error_message ?? t.task_status}`;
}

// --- the two high-level operations -------------------------------------------

async function runAsync(args: RunConversionArgs): Promise<ConvertDocumentResponse | ChunkResult> {
  const task = await submitJob(args);
  const deadline = Date.now() + args.timeoutMs;
  for (;;) {
    if (Date.now() > deadline) {
      throw new DoclingError(
        "DEADLINE",
        `The docling job did not finish within ${Math.round(args.timeoutMs / 1000)} s (task ${task.task_id} may still be running server-side — use “Submit Job” + “Get Result” to continue it later).`,
        true,
      );
    }
    const status = await pollTask(args.auth, task.task_id, 5);
    if (status.task_status === "failure") {
      throw new DoclingError("JOB_FAILED", jobFailureMessage(status), status.failure?.retryable ?? false);
    }
    if (status.task_status === "success" || status.task_status === "partial_success" || status.task_status === "skipped") {
      const result = await fetchResult(args.auth, task.task_id);
      if ("failure" in result && !("document" in result) && !("chunks" in result)) {
        throw new DoclingError("JOB_FAILED", jobFailureMessage({ ...status, failure: result.failure }), result.failure?.retryable ?? false);
      }
      if (args.path === "convert") {
        const conv = result as ConvertDocumentResponse;
        if (conv.status === "failure") {
          // no-base-to-string: error_message is unknown (JSON-derived); the cast is
          // type-level only — the template applies ToString exactly as before.
          const first = conv.errors?.[0]?.error_message as string | undefined;
          throw new DoclingError("JOB_FAILED", `docling conversion failed: ${first ?? "unknown error"}`, false);
        }
      }
      // TS 5.9's `in`-narrowing keeps the {failure} constituent after the guard; the
      // guard above already throws for it, so assert the result union here.
      return result as ConvertDocumentResponse | ChunkResult;
    }
  }
}

function runSync(args: RunConversionArgs): Promise<ConvertDocumentResponse | ChunkResult> {
  return withBackoff(() =>
    send<ConvertDocumentResponse | ChunkResult>(
      HttpMethod.POST,
      url(args.auth, endpointPath(args, false)),
      { sources: sourceBody(args.source), options: args.options, target: { kind: "inbody" } },
      args.auth.apiKey,
      args.timeoutMs,
    ).then((res) => {
      const body = res.body as ConvertDocumentResponse;
      if (args.path === "convert" && "status" in body && body.status === "failure") {
        // Same no-base-to-string adaptation as in runAsync (type-level cast only).
        const first = body.errors?.[0]?.error_message as string | undefined;
        throw new DoclingError("JOB_FAILED", `docling conversion failed: ${first ?? "unknown error"}`, false);
      }
      return res.body;
    }),
  );
}

export function runConversion(args: RunConversionArgs): Promise<ConvertDocumentResponse> {
  return (args.mode === "sync" ? runSync(args) : runAsync(args)).then(
    (r) => r as ConvertDocumentResponse,
  );
}

export function runChunk(args: RunConversionArgs): Promise<ChunkResult> {
  return (args.mode === "sync" ? runSync({ ...args, path: "chunk" }) : runAsync({ ...args, path: "chunk" })).then(
    (r) => r as ChunkResult,
  );
}
