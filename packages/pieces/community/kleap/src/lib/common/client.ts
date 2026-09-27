import { httpClient, HttpMethod, HttpError } from '@activepieces/pieces-common';

export const KLEAP_API_BASE_URL = 'https://kleap.co/api/v1';
export const KLEAP_USER_AGENT = 'kleap-activepieces';
export const KLEAP_SOURCE = 'activepieces';

// The task long-poll holds the connection up to 50 s server-side; leave headroom.
const LONG_POLL_TIMEOUT_MS = 75_000;
const DEFAULT_TIMEOUT_MS = 60_000;

/** A SecretText connection reaches `validate` as a string and every other hook as `{ secret_text }`. */
export type KleapAuthValue = string | { secret_text?: string } | null | undefined;

export function apiKeyOf(auth: KleapAuthValue): string {
  const key = typeof auth === 'string' ? auth : auth?.secret_text;
  if (!key || !key.trim()) {
    throw new Error('Missing Kleap API key. Connect your Kleap account first.');
  }
  return key.trim();
}

export type JsonObject = Record<string, unknown>;

/** Kleap answers every error as `{ error: { code, message, details, request_id } }`. */
export class KleapApiError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly code: string | undefined,
    readonly details: JsonObject | undefined,
    readonly requestId: string | undefined,
  ) {
    super(message);
    this.name = 'KleapApiError';
  }
}

interface KleapErrorBody {
  error?: { code?: string; message?: string; details?: JsonObject; request_id?: string };
}

const HINTS: Record<string, string> = {
  INSUFFICIENT_SCOPE:
    'Create a new API key with the Full preset on https://kleap.co/settings/api-key, then update this connection.',
  DATABASE_NOT_PROVISIONED:
    'This app has no Kleap Database yet. Use "Edit App With AI" with a message like "add a database", then try again.',
  INSUFFICIENT_CREDITS: 'Top up your Kleap credits on kleap.co, then try again.',
  // The API message already lists what Run SQL accepts; only point to the fallback.
  UNSUPPORTED_STATEMENT: 'The row actions (Find / Insert / Update / Delete Rows) remain available.',
  RLS_REQUIRED: 'Enable row level security on the new public table (ALTER TABLE … ENABLE ROW LEVEL SECURITY) in the same SQL.',
};

function parseBody(body: unknown): KleapErrorBody | undefined {
  let parsed = body;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return undefined;
    }
  }
  if (parsed && typeof parsed === 'object' && 'error' in parsed) return parsed as KleapErrorBody;
  return undefined;
}

export function toKleapError(error: unknown): Error {
  if (error instanceof KleapApiError) return error;
  const e = error as { response?: { status?: number; body?: unknown }; message?: string };
  const response = error instanceof HttpError ? error.response : e?.response;
  const status = response?.status;
  const kleap = parseBody(response?.body)?.error;
  if (!kleap?.message) {
    const raw = response?.body !== undefined ? ` ${JSON.stringify(response.body).slice(0, 500)}` : '';
    return new KleapApiError(
      `${status ? `HTTP ${status}: ` : ''}${e?.message ?? 'Kleap request failed'}${raw}`,
      status,
      undefined,
      undefined,
      undefined,
    );
  }
  const details = kleap.details && Object.keys(kleap.details).length ? ` Details: ${JSON.stringify(kleap.details)}` : '';
  const hint = kleap.code && HINTS[kleap.code] ? ` ${HINTS[kleap.code]}` : '';
  const requestId = kleap.request_id ? ` (request ${kleap.request_id})` : '';
  const head = kleap.code ? `${kleap.code}: ${kleap.message}` : kleap.message;
  return new KleapApiError(`${head}${details}${hint}${requestId}`, status, kleap.code, kleap.details, kleap.request_id);
}

export interface KleapRequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

function cleanQuery(query: KleapRequestOptions['query']): Record<string, string> | undefined {
  if (!query) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = String(v);
  }
  return Object.keys(out).length ? out : undefined;
}

/** The API allows 30 requests per minute on the standard tier and answers 429 RATE_LIMITED with
 * `details.retry_after` (seconds). Waiting that long and retrying beats failing the flow step. */
export const rateLimitPolicy = { maxRetries: 2, maxWaitSeconds: 65, unitMs: 1000 };

export async function kleapRequest<T = JsonObject>(
  auth: KleapAuthValue,
  method: HttpMethod,
  path: string,
  options: KleapRequestOptions = {},
): Promise<T> {
  const apiKey = apiKeyOf(auth);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${KLEAP_API_BASE_URL}${path}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'User-Agent': KLEAP_USER_AGENT,
          Accept: 'application/json',
        },
        queryParams: cleanQuery(options.query),
        body: options.body,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });
      return response.body;
    } catch (error) {
      const kleapError = toKleapError(error);
      const retryAfter = Number((kleapError as KleapApiError).details?.['retry_after'] ?? 30);
      // 429 RATE_LIMITED (per-minute quota, or details.concurrent_active: 2 app creations at once per user)
      // and 503 SERVICE_BUSY mean the request was refused before doing anything, so retrying is safe.
      const rateLimited =
        kleapError instanceof KleapApiError &&
        (kleapError.status === 429 || kleapError.code === 'RATE_LIMITED' || kleapError.code === 'SERVICE_BUSY');
      if (rateLimited && attempt < rateLimitPolicy.maxRetries && retryAfter <= rateLimitPolicy.maxWaitSeconds) {
        await sleep(Math.max(1, retryAfter) * rateLimitPolicy.unitMs);
        continue;
      }
      throw kleapError;
    }
  }
}

/** Same as kleapRequest, but hands back the Kleap error code instead of throwing for the listed codes. */
export async function kleapRequestAllowing<T = JsonObject>(
  auth: KleapAuthValue,
  allowedCodes: string[],
  method: HttpMethod,
  path: string,
  options: KleapRequestOptions = {},
): Promise<{ data?: T; errorCode?: string; errorDetails?: JsonObject }> {
  try {
    return { data: await kleapRequest<T>(auth, method, path, options) };
  } catch (error) {
    if (error instanceof KleapApiError && error.code && allowedCodes.includes(error.code)) {
      return { errorCode: error.code, errorDetails: error.details };
    }
    throw error;
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll interval used when the server-side long-poll window is 0 (deadline almost reached). */
export const pollDelay = { ms: 3000 };

/**
 * Long-polls GET /tasks/{id} until the task is completed or failed, or the deadline passes.
 * A failed task throws; a deadline returns the last state with `wait_timed_out: true` so the
 * flow can keep the task_id and check again later with "Get Task".
 */
export async function waitForTask(auth: KleapAuthValue, taskId: string, timeoutMinutes: number): Promise<JsonObject> {
  const deadline = Date.now() + clampMinutes(timeoutMinutes) * 60_000;
  for (;;) {
    const remainingSeconds = Math.floor((deadline - Date.now()) / 1000);
    const wait = Math.max(0, Math.min(50, remainingSeconds));
    const task = await kleapRequest(auth, HttpMethod.GET, `/tasks/${encodeURIComponent(taskId)}`, {
      query: { wait },
      timeoutMs: LONG_POLL_TIMEOUT_MS,
    });
    const status = task['status'];
    if (status === 'completed') return task;
    if (status === 'failed') {
      const err = (task['error'] as JsonObject | undefined) ?? {};
      throw new KleapApiError(
        `Kleap task ${taskId} failed: ${(err['code'] as string) ?? 'TASK_FAILED'} ${(err['message'] as string) ?? ''}`.trim() +
          '. If some files were already written, the "Retry Task" action resumes the generation from them.',
        undefined,
        (err['code'] as string) ?? 'TASK_FAILED',
        err,
        undefined,
      );
    }
    if (Date.now() >= deadline) return { ...task, wait_timed_out: true };
    if (wait === 0) await sleep(pollDelay.ms);
  }
}

/**
 * Starts a deploy (unless one already runs: 409 CONFLICT carries its deploy_key) and, when asked,
 * long-polls its status until the site is live. Returns the final status, including `report`.
 */
export async function publishAndWait(
  auth: KleapAuthValue,
  appId: string,
  waitForLive: boolean,
  timeoutMinutes: number,
): Promise<JsonObject> {
  const started = await kleapRequestAllowing(auth, ['CONFLICT'], HttpMethod.POST, `/apps/${appId}/publish`);
  const deployKey =
    (started.data?.['deploy_key'] as string | undefined) ?? (started.errorDetails?.['deploy_key'] as string | undefined);

  if (!waitForLive) {
    return started.data ?? { id: Number(appId), status: 'deploying', deploy_key: deployKey ?? null, already_running: true };
  }

  const deadline = Date.now() + clampMinutes(timeoutMinutes) * 60_000;
  for (;;) {
    const remainingSeconds = Math.floor((deadline - Date.now()) / 1000);
    const wait = Math.max(0, Math.min(45, remainingSeconds));
    const status = await kleapRequest(auth, HttpMethod.GET, `/apps/${appId}/publish`, {
      query: { wait, deploy_key: deployKey },
      timeoutMs: LONG_POLL_TIMEOUT_MS,
    });
    if (status['status'] === 'published') return { ...status, deploy_key: deployKey ?? status['deploy_key'] ?? null };
    if (Date.now() >= deadline) return { ...status, deploy_key: deployKey ?? null, wait_timed_out: true };
    if (wait === 0) await sleep(pollDelay.ms);
  }
}

function clampMinutes(minutes: number | undefined): number {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 20);
}

/** Accepts a numeric app id, or a site URL / domain / slug resolved through GET /apps/resolve. */
export async function resolveAppId(auth: KleapAuthValue, value: unknown): Promise<string> {
  const raw = String(value ?? '').trim();
  if (!raw) throw new Error('No app selected.');
  if (/^\d+$/.test(raw)) return raw;
  const match = await kleapRequest(auth, HttpMethod.GET, '/apps/resolve', { query: { q: raw } });
  if (match['app_id'] === undefined || match['app_id'] === null) {
    throw new Error(`No Kleap app matches "${raw}".`);
  }
  return String(match['app_id']);
}

/** "a, b\nc" or ["a","b"] → ["a","b","c"] */
export function toList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const parts = Array.isArray(value) ? value.map((v) => String(v ?? '')) : String(value).split(/[\n,]/);
  return parts.map((v) => v.trim()).filter(Boolean);
}

/** The domain search wants one label ("cafelumiere"), not a phrase: "Café Lumière" would be refused. */
export function normalizeDomainQuery(query: string): string {
  return String(query ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '');
}

export function flattenSubmission(submission: JsonObject, appId: string | number): JsonObject {
  const data = (submission['data'] as JsonObject | undefined) ?? {};
  return {
    ...data,
    submission_id: submission['id'],
    submitted_at: submission['submitted_at'],
    app_id: Number(appId),
  };
}

/** Parses a JSON property that the builder may hand over as an object, an array or a JSON string. */
export function parseJsonInput<T = unknown>(value: unknown, label: string): T | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new Error(`${label} is not valid JSON.`);
    }
  }
  return value as T;
}

export function requireWhere(value: unknown): JsonObject {
  const where = parseJsonInput<JsonObject>(value, 'Where');
  if (!where || typeof where !== 'object' || Array.isArray(where) || !Object.keys(where).length) {
    throw new Error('Choose a "Match Column" and a "Match Value" (e.g. id = 42). This protects you from changing every row.');
  }
  return where;
}
