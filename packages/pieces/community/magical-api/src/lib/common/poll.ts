import { magicalApiRequest } from './client';

export async function fetchJobResult({
  apiKey,
  service,
  requestId,
}: {
  apiKey: string;
  service: MagicalApiService;
  requestId: string;
}): Promise<JobResult> {
  const response = await magicalApiRequest({
    apiKey,
    path: SERVICES[service].path,
    body: { request_id: requestId.trim() },
  });
  return toJobResult({ service, data: response.body.data, fallbackRequestId: requestId.trim() });
}

export async function runJob({
  apiKey,
  service,
  input,
  requestId,
  sleep = defaultSleep,
}: {
  apiKey: string;
  service: MagicalApiService;
  input: Record<string, string>;
  requestId: string | undefined;
  sleep?: (ms: number) => Promise<void>;
}): Promise<Record<string, unknown>> {
  const trimmedRequestId = normalizeRequestId(requestId);
  let result: JobResult;
  if (trimmedRequestId) {
    result = await fetchJobResult({ apiKey, service, requestId: trimmedRequestId });
  } else {
    const response = await magicalApiRequest({ apiKey, path: SERVICES[service].path, body: input });
    result = toJobResult({ service, data: response.body.data, fallbackRequestId: undefined });
  }
  if (result.status === 'ready') {
    return result.data;
  }
  const pendingId = result.request_id;
  if (!pendingId) {
    throw new Error(
      `MagicalAPI did not return a Request ID or a finished result for ${SERVICES[service].label}. Response data: ${JSON.stringify(result.data).slice(0, 500)}`,
    );
  }
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const polled = await fetchJobResult({ apiKey, service, requestId: pendingId });
    if (polled.status === 'ready') {
      return polled.data;
    }
  }
  throw new Error(
    `${SERVICES[service].label} is still processing after ${(POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds. Run the step again with Request ID ${pendingId} (or use Get Job Result) to get the result without starting (and paying for) a new job.`,
  );
}

export function normalizeRequestId(requestId: string | null | undefined): string | undefined {
  if (requestId === undefined || requestId === null || requestId === '') {
    return undefined;
  }
  const trimmed = requestId.trim();
  if (trimmed.length === 0) {
    throw new Error(
      'Request ID is blank. Paste the Request ID from an earlier run to get its result, or clear the field to start a new (paid) request.',
    );
  }
  return trimmed;
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const POLL_MAX_ATTEMPTS = 20;
export const POLL_INTERVAL_MS = 3000;

export const SERVICES: Record<MagicalApiService, ServiceDefinition> = {
  resume_parser: {
    path: '/resume-parser',
    label: 'Resume parsing',
    isReady: (data) => data['basic'] !== undefined,
  },
  resume_review: {
    path: '/resume-review',
    label: 'Resume review',
    isReady: (data) => data['score'] !== undefined,
  },
  resume_score: {
    path: '/resume-score',
    label: 'Resume scoring',
    isReady: (data) => data['score'] !== undefined,
  },
  profile_data: {
    path: '/profile-data',
    label: 'LinkedIn profile lookup',
    isReady: (data) => data['profile'] !== undefined,
  },
  company_data: {
    path: '/company-data',
    label: 'LinkedIn company lookup',
    isReady: (data) => data['company_name'] !== undefined,
  },
};

function toJobResult({
  service,
  data,
  fallbackRequestId,
}: {
  service: MagicalApiService;
  data: Record<string, unknown> | undefined;
  fallbackRequestId: string | undefined;
}): JobResult {
  const payload = data ?? {};
  if (SERVICES[service].isReady(payload)) {
    return { status: 'ready', request_id: fallbackRequestId ?? null, data: payload };
  }
  const returnedId = payload['request_id'];
  const requestId = typeof returnedId === 'string' && returnedId.length > 0 ? returnedId : fallbackRequestId;
  return { status: 'processing', request_id: requestId ?? null, data: payload };
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MagicalApiService = 'resume_parser' | 'resume_review' | 'resume_score' | 'profile_data' | 'company_data';

type ServiceDefinition = {
  path: string;
  label: string;
  isReady: (data: Record<string, unknown>) => boolean;
};

export type JobResult = {
  status: 'ready' | 'processing';
  request_id: string | null;
  data: Record<string, unknown>;
};
