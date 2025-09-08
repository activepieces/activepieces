import { httpClient, HttpMethod, HttpRequest, HttpResponse } from '@activepieces/pieces-common';

export const DEFAULT_BASE_URL = 'https://api.cloudconvert.com/v2';

export type Bearer = string;

export interface CloudConvertWebhook {
  id: string;
  url: string;
  events: string[];
  signing_secret?: string;
}

export interface CloudConvertJob {
  id: string;
  status: 'pending' | 'processing' | 'finished' | 'error' | string;
  tasks?: CloudConvertTask[];
}

export interface CloudConvertTask {
  id: string;
  name?: string;
  operation: string;
  status: 'waiting' | 'processing' | 'finished' | 'error' | string;
  result?: {
    files?: Array<{
      filename?: string;
      url?: string;
      size?: number;
      expires_at?: string;
      [k: string]: unknown;
    }>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export function getBaseUrl(endpointOverride?: string): string {
  return endpointOverride && endpointOverride.trim().length > 0 ? endpointOverride.trim() : DEFAULT_BASE_URL;
}

export async function ccRequest<T = unknown>(opts: {
  method: HttpMethod;
  path: string;
  auth: Bearer;
  endpointOverride?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const urlBase = getBaseUrl(opts.endpointOverride);
  const q = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const req: HttpRequest = {
    method: opts.method,
    url: `${urlBase}${opts.path}${q}`,
    headers: {
      Authorization: `Bearer ${opts.auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers ?? {}),
    },
    body: opts.body,
  };

  const res = await httpClient.sendRequest<T>(req);
  return res;
}

export async function createWebhook(params: {
  auth: Bearer;
  webhookUrl: string;
  events: string[];
  endpointOverride?: string;
}): Promise<CloudConvertWebhook> {
  const body = {
    url: params.webhookUrl,
    events: params.events,
  };
  const res = await ccRequest<{ data: CloudConvertWebhook }>({
    method: HttpMethod.POST,
    path: '/webhooks',
    auth: params.auth,
    endpointOverride: params.endpointOverride,
    body,
  });
  return res.body.data;
}

export async function deleteWebhook(params: {
  auth: Bearer;
  webhookId: string;
  endpointOverride?: string;
}): Promise<void> {
  await ccRequest({
    method: HttpMethod.DELETE,
    path: `/webhooks/${encodeURIComponent(params.webhookId)}`,
    auth: params.auth,
    endpointOverride: params.endpointOverride,
  });
}

export async function createJob(params: {
  auth: Bearer;
  tasks: Record<string, unknown>;
  endpointOverride?: string;
}): Promise<CloudConvertJob> {
  const res = await ccRequest<{ data: CloudConvertJob }>({
    method: HttpMethod.POST,
    path: '/jobs',
    auth: params.auth,
    endpointOverride: params.endpointOverride,
    body: { tasks: params.tasks },
  });
  return res.body.data;
}

export async function getJob(params: {
  auth: Bearer;
  jobId: string;
  includeTasks?: boolean;
  endpointOverride?: string;
}): Promise<CloudConvertJob> {
  const res = await ccRequest<{ data: CloudConvertJob }>({
    method: HttpMethod.GET,
    path: `/jobs/${encodeURIComponent(params.jobId)}`,
    auth: params.auth,
    endpointOverride: params.endpointOverride,
    query: params.includeTasks ? { include: 'tasks' } : undefined,
  });
  return res.body.data;
}

export async function pollJobUntilDone(params: {
  auth: Bearer;
  jobId: string;
  endpointOverride?: string;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<CloudConvertJob> {
  const timeoutMs = params.timeoutMs ?? 5 * 60_000;
  const intervalMs = params.intervalMs ?? 2_000;
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await getJob({
      auth: params.auth,
      jobId: params.jobId,
      includeTasks: true,
      endpointOverride: params.endpointOverride,
    });
    if (job.status === 'finished' || job.status === 'error') return job;
    if (Date.now() - start > timeoutMs) return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function extractExportedFiles(job: CloudConvertJob): Array<{
  filename?: string;
  url?: string;
  size?: number;
  expires_at?: string;
}> {
  const files: Array<{ filename?: string; url?: string; size?: number; expires_at?: string }> = [];
  for (const t of job.tasks ?? []) {
    if (t.operation === 'export/url' && t.result?.files?.length) {
      for (const f of t.result.files) {
        files.push({
          filename: f.filename,
          url: f.url,
          size: f.size,
          expires_at: f.expires_at,
        });
      }
    }
  }
  return files;
}