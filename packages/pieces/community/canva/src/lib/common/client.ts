import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.canva.com/rest/v1';
const DEFAULT_TIMEOUT_MS = 30_000;
const FIRST_POLL_DELAY_MS = 1_000;
const MAX_POLL_DELAY_MS = 5_000;
const POLL_BACKOFF = 1.5;
let verifiedTlsAgent: Promise<unknown> | undefined;

const STATUS_HINTS: Record<number, string> = {
  400: 'Canva rejected the request (HTTP 400).',
  401: 'Canva rejected the connection (HTTP 401). Reconnect your Canva account.',
  403: 'Canva denied access (HTTP 403). Check that you can access this item and that the connection has the needed permission.',
  404: 'Canva could not find that item (HTTP 404). Check the ID.',
  409: 'Canva reported a conflict (HTTP 409).',
  413: 'The file is too large for Canva (HTTP 413).',
  415: 'Canva does not support this file type (HTTP 415).',
  429: 'Canva rate limit reached (HTTP 429). Wait a minute and try again.',
};

class CanvaApiError extends Error {
  public readonly status: number | undefined;
  public readonly code: string | undefined;
  public readonly responseBody: unknown;

  constructor({ message, status, code, responseBody }: { message: string; status?: number; code?: string; responseBody: unknown }) {
    super(message);
    this.name = 'CanvaApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: Reflect.get(response, 'body') };
}

function readString({ source, key }: { source: unknown; key: string }): string | undefined {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  const value: unknown = Reflect.get(source, key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toCanvaError({ status, body }: { status: number; body: unknown }): CanvaApiError {
  const prefix = STATUS_HINTS[status] ?? `Canva API request failed (HTTP ${status}).`;
  const code = readString({ source: body, key: 'code' });
  const vendorMessage = typeof body === 'string' && body.length > 0 ? body.slice(0, 500) : readString({ source: body, key: 'message' });
  const detail = vendorMessage ? ` Canva says: ${vendorMessage}${code ? ` (${code})` : ''}` : code ? ` Canva error code: ${code}` : '';
  return new CanvaApiError({ message: `${prefix}${detail}`, status, code, responseBody: body });
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

async function request<T>({
  token,
  method,
  path,
  body,
  queryParams,
  headers,
  timeoutMs,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: HttpRequest['body'];
  queryParams?: QueryParams;
  headers?: Record<string, string>;
  timeoutMs?: number;
}): Promise<T> {
  const finalHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...headers,
  };
  if (body !== undefined && finalHeaders['Content-Type'] === undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: finalHeaders,
      body,
      queryParams,
      timeout: timeoutMs ?? DEFAULT_TIMEOUT_MS,
      redactBodyInErrors: Buffer.isBuffer(body),
    }, { dispatcher: await canvaClient.verifiedTls() });
    return response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (failure) {
      throw toCanvaError(failure);
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJob<J extends { id: string; status: string }>({
  initial,
  fetchJob,
  timeoutSeconds,
  jobLabel,
  statusAction,
}: {
  jobLabel: string;
  statusAction?: string;
  initial: J;
  fetchJob: (jobId: string) => Promise<J>;
  timeoutSeconds: number;
}): Promise<{ job: J; timedOut: boolean }> {
  let job = initial;
  const started = Date.now();
  const budgetMs = Math.max(0, timeoutSeconds) * 1000;
  let slept = 0;
  let delay = FIRST_POLL_DELAY_MS;
  while (job.status === 'in_progress') {
    const elapsed = Math.max(Date.now() - started, slept);
    const remaining = budgetMs - elapsed;
    if (remaining <= 0) {
      return { job, timedOut: true };
    }
    const wait = Math.min(delay, remaining);
    await canvaClient.sleep(wait);
    slept += wait;
    delay = Math.min(Math.round(delay * POLL_BACKOFF), MAX_POLL_DELAY_MS);
    job = await fetchStatus({ fetchJob, jobId: job.id, jobLabel, statusAction });
  }
  return { job, timedOut: false };
}

async function fetchStatus<J>({ fetchJob, jobId, jobLabel, statusAction }: { fetchJob: (jobId: string) => Promise<J>; jobId: string; jobLabel: string; statusAction?: string }): Promise<J> {
  try {
    return await fetchJob(jobId);
  } catch (error) {
    throw jobPollError({ jobLabel, jobId, error, statusAction });
  }
}

function jobPollError({ jobLabel, jobId, error, statusAction }: { jobLabel: string; jobId: string; error: unknown; statusAction?: string }): CanvaApiError {
  const reason = error instanceof Error ? error.message : String(error);
  const message = `Checking the status of the Canva ${jobLabel} job ${jobId} failed: ${reason} The job may still be running in Canva. Use ${statusAction ?? 'the Get Job Status action'} with job ID ${jobId} instead of starting the job again.`;
  if (error instanceof CanvaApiError) {
    return new CanvaApiError({ message, status: error.status, code: error.code, responseBody: error.responseBody });
  }
  return new CanvaApiError({ message, responseBody: undefined });
}

function jobFailureError({ jobLabel, jobId, error }: { jobLabel: string; jobId: string; error?: { code?: string; message?: string } }): CanvaApiError {
  const reason = error?.message ? ` Canva says: ${error.message}${error.code ? ` (${error.code})` : ''}` : '';
  return new CanvaApiError({
    message: `The Canva ${jobLabel} job ${jobId} failed.${reason}`,
    code: error?.code,
    responseBody: error,
  });
}

function jobTimeoutError({ jobLabel, jobId, timeoutSeconds }: { jobLabel: string; jobId: string; timeoutSeconds: number }): Error {
  return new Error(
    `The Canva ${jobLabel} job ${jobId} was still running after ${timeoutSeconds} seconds. Use the Get Job Status action with this job ID to fetch the result later, or raise the maximum wait.`
  );
}

export const canvaClient = {
  baseUrl: BASE_URL,
  request,
  sleep,
  verifiedTls,
  waitForJob,
  jobFailureError,
  jobTimeoutError,
};

export { CanvaApiError };
