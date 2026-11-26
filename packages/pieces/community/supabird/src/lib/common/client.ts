import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const SUPABIRD_API_URL = 'https://api.supabird.io/v1';

export type SupabirdSocialSet = {
  id: string;
  name: string;
  is_default?: boolean;
  can_post?: boolean;
  x_username?: string | null;
};

export type SupabirdMe = {
  name?: string;
  x_username?: string | null;
  plan?: string;
};

export type SupabirdPage<T> = {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export type SupabirdJob = {
  id?: string;
  type?: string;
  status: 'running' | 'completed' | 'failed';
  created_at?: string | null;
  posts_so_far?: number;
  posts?: { id: string; content: string }[];
  http_status?: number;
  result?: unknown;
  error?: string;
};

type SupabirdErrorBody = { error?: string; message?: string };

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null) {
    const message = (body as SupabirdErrorBody).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  return undefined;
}

export function describeApiError(error: unknown): string {
  if (error instanceof HttpError) {
    const { status, body } = error.response;
    const apiMessage = readErrorMessage(body);
    if (status === 401) {
      return apiMessage ?? 'This SupaBird API key is not valid.';
    }
    if (status === 402) {
      return `SupaBird Pro or trial plan needed. ${apiMessage ?? ''}`.trim();
    }
    if (status === 429) {
      return 'SupaBird rate limit reached (60 requests per minute, 20 writes per minute). Wait a minute and try again.';
    }
    return apiMessage ?? `SupaBird returned status ${status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

export async function supabirdRequest<T = unknown>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
}): Promise<{ status: number; body: T }> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${SUPABIRD_API_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body,
      queryParams,
    });
    return { status: response.status, body: response.body };
  } catch (error) {
    throw new Error(describeApiError(error));
  }
}

const JOB_POLL_INTERVAL_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForJob({
  token,
  jobId,
  timeoutMs,
  intervalMs = JOB_POLL_INTERVAL_MS,
}: {
  token: string;
  jobId: string;
  timeoutMs: number;
  intervalMs?: number;
}): Promise<SupabirdJob> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { body: job } = await supabirdRequest<SupabirdJob>({
      token,
      method: HttpMethod.GET,
      path: `/jobs/${encodeURIComponent(jobId)}`,
    });
    if (job.status === 'completed') {
      return job;
    }
    if (job.status === 'failed') {
      throw new Error(job.error ?? 'The SupaBird job failed.');
    }
    if (Date.now() + intervalMs > deadline) {
      throw new Error(
        `The SupaBird job is still running after ${Math.round(timeoutMs / 1000)} seconds (job id ${jobId}). SupaBird keeps job results for 1 hour.`
      );
    }
    await sleep(intervalMs);
  }
}

/**
 * Long calls answer 202 {job_id}. Poll the job and return the body the call
 * would have answered with (job.result). Fast calls are returned unchanged.
 */
export async function resolveJobResponse<T>({
  token,
  response,
  timeoutMs,
  intervalMs,
}: {
  token: string;
  response: { status: number; body: unknown };
  timeoutMs: number;
  intervalMs?: number;
}): Promise<T> {
  const started = response.body as { job_id?: string } | null;
  if (response.status !== 202 || !started?.job_id) {
    return response.body as T;
  }
  const job = await waitForJob({
    token,
    jobId: started.job_id,
    timeoutMs,
    intervalMs,
  });
  if (typeof job.http_status === 'number' && job.http_status >= 400) {
    throw new Error(
      readErrorMessage(job.result) ??
        `SupaBird could not finish the request (status ${job.http_status}).`
    );
  }
  return (job.result ?? job) as T;
}

export async function listSocialSets(
  token: string
): Promise<SupabirdSocialSet[]> {
  const { body } = await supabirdRequest<{ data: SupabirdSocialSet[] }>({
    token,
    method: HttpMethod.GET,
    path: '/social-sets',
  });
  return body.data;
}
