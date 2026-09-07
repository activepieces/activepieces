import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';

export type ScruppAuth = AppConnectionValueForAuthProperty<typeof scruppAuth>;

const BASE_URL = 'https://api.scrupp.com/api/v1';

/** Statuses Scrupp reports for a job. */
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export async function scruppApiCall<T>({
  auth,
  method,
  endpoint,
  body,
  headers,
}: {
  auth: ScruppAuth;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    url: `${BASE_URL}${endpoint}`,
    method,
    headers: {
      Authorization: `Bearer ${auth.secret_text}`,
      ...(headers ?? {}),
    },
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

/**
 * Scrupp extraction is asynchronous: create a job, poll it, then read the
 * result. This runs the whole loop and hands back the records.
 *
 * The Idempotency-Key matters here — Activepieces retries a failed step, and
 * without it a retry would start (and charge for) a second job. With it the
 * retry is handed the original one.
 */
export async function runScruppJob({
  auth,
  type,
  input,
  idempotencyKey,
  timeoutSeconds,
}: {
  auth: ScruppAuth;
  type: string;
  input: Record<string, unknown>;
  idempotencyKey: string;
  timeoutSeconds: number;
}): Promise<unknown[]> {
  const created = await scruppApiCall<{ job_id: number }>({
    auth,
    method: HttpMethod.POST,
    endpoint: '/jobs',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: { type, input },
  });

  const jobId = created.job_id;
  const deadline = Date.now() + timeoutSeconds * 1000;
  let status: JobStatus = 'queued';

  while (Date.now() < deadline) {
    const state = await scruppApiCall<{
      status: JobStatus;
      retry_after?: number;
      error?: string | null;
    }>({
      auth,
      method: HttpMethod.GET,
      endpoint: `/jobs/${jobId}`,
    });

    status = state.status;

    if (status === 'succeeded') {
      break;
    }

    if (status === 'failed') {
      throw new Error(state.error ?? `Scrupp job ${jobId} failed.`);
    }

    // The API tells us how long to wait; honouring it keeps the poll count down.
    const waitSeconds = state.retry_after && state.retry_after > 0 ? state.retry_after : 5;
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }

  if (status !== 'succeeded') {
    throw new Error(
      `Scrupp job ${jobId} did not finish within ${timeoutSeconds} seconds. It is still running and can be fetched later with its job ID.`
    );
  }

  const result = await scruppApiCall<{ data?: { items?: unknown[] } }>({
    auth,
    method: HttpMethod.GET,
    endpoint: `/jobs/${jobId}/result`,
  });

  return result.data?.items ?? [];
}
