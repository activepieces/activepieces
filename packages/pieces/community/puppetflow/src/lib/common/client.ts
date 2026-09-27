import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';

const API_PREFIX = '/api/v1';

export type PuppetflowCredentials = {
  instanceUrl: string;
  apiKey: string;
};

export type PuppetflowQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | PuppetflowQueryValue[]
  | { [key: string]: PuppetflowQueryValue };

export type PuppetflowQuery = Record<string, PuppetflowQueryValue>;

export type PuppetflowRequest = {
  credentials: PuppetflowCredentials;
  method: HttpMethod;
  path: string;
  query?: PuppetflowQuery;
  body?: Record<string, unknown>;
  responseType?: 'json' | 'arraybuffer';
};

export type PuppetflowFlowInputDefinition = {
  name: string;
  type?: string;
  default?: unknown;
};

export type PuppetflowFlow = {
  id: string;
  name: string;
  description?: string | null;
  flow_type: 'code' | 'nodal';
  folder_id?: string | null;
  is_published?: boolean;
  default_inputs?: Record<string, unknown> | null;
  input_definitions?: PuppetflowFlowInputDefinition[];
  updated_at?: string;
};

export type PuppetflowRunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'cancelled';

export type PuppetflowRun = {
  id: number;
  flow_id: string;
  status: PuppetflowRunStatus;
  output?: Record<string, unknown> | null;
  error_message?: string | null;
  duration_ms?: number | null;
  waiting_for_human_validation?: boolean;
  human_validation_wait_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PuppetflowTriggerResponse = {
  run_id: number;
  flow_id: string;
  status: string;
};

export type PuppetflowPaginatedRuns = {
  data: PuppetflowRun[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type PuppetflowArtifact = {
  name: string;
  size: number;
  modified_at: string;
};

export const TERMINAL_RUN_STATUSES: PuppetflowRunStatus[] = [
  'success',
  'error',
  'cancelled',
];

export function normalizeInstanceUrl(instanceUrl: string): string {
  return instanceUrl.trim().replace(/\/+$/, '');
}

function appendQueryValue(
  params: URLSearchParams,
  key: string,
  value: PuppetflowQueryValue
): void {
  if (value === undefined || value === null || value === '') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const itemKey =
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? `${key}[${index}]`
          : `${key}[]`;
      appendQueryValue(params, itemKey, item);
    });
    return;
  }
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendQueryValue(params, `${key}[${childKey}]`, childValue);
    }
    return;
  }
  if (typeof value === 'boolean') {
    params.append(key, value ? '1' : '0');
    return;
  }
  params.append(key, String(value));
}

export function buildQueryString(query?: PuppetflowQuery): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(params, key, value);
  }
  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

export async function puppetflowRawRequest<T>({
  credentials,
  method,
  path,
  query,
  body,
  responseType = 'json',
}: PuppetflowRequest): Promise<HttpResponse<T>> {
  const url = `${normalizeInstanceUrl(
    credentials.instanceUrl
  )}${API_PREFIX}${path}${buildQueryString(query)}`;

  return httpClient.sendRequest<T>({
    method,
    url,
    body,
    responseType,
    headers: {
      Accept: responseType === 'json' ? 'application/json' : '*/*',
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: credentials.apiKey,
    },
  });
}

export async function puppetflowRequest<T>(
  request: PuppetflowRequest
): Promise<T> {
  const response = await puppetflowRawRequest<T>(request);
  return response.body;
}

export function flowPath(flowId: string): string {
  return `/flows/${encodeURIComponent(flowId)}`;
}

export function runPath(flowId: string, runId: string | number): string {
  return `${flowPath(flowId)}/runs/${encodeURIComponent(String(runId))}`;
}

export async function getRun(
  credentials: PuppetflowCredentials,
  flowId: string,
  runId: string | number,
  query?: PuppetflowQuery
): Promise<PuppetflowRun> {
  return puppetflowRequest<PuppetflowRun>({
    credentials,
    method: HttpMethod.GET,
    path: runPath(flowId, runId),
    query,
  });
}

export function contentTypeOf(
  headers: HttpResponse['headers'],
  fallback: string
): string {
  const raw = headers?.['content-type'] ?? headers?.['Content-Type'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}
