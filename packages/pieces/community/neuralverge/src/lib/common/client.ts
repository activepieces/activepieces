import {
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

async function post({
  apiKey,
  endpoint,
  body,
  requiredKeys = [],
}: {
  apiKey: string;
  endpoint: string;
  body: Record<string, unknown>;
  requiredKeys?: string[];
}): Promise<NeuralvergeEnvelope> {
  const pruned = pruneEmpty(body);
  const defaults = Object.fromEntries(requiredKeys.map((key) => [key, {}]));
  return send({
    apiKey,
    method: HttpMethod.POST,
    endpoint,
    body: { ...defaults, ...pruned },
  });
}

async function getSessionStatus({
  apiKey,
  sessionId,
}: {
  apiKey: string;
  sessionId: string;
}): Promise<NeuralvergeSessionStatus> {
  return send({
    apiKey,
    method: HttpMethod.GET,
    endpoint: 'get-session-status',
    queryParams: { session_id: sessionId },
  });
}

async function waitForSession({
  apiKey,
  sessionId,
  timeoutSeconds,
  pollIntervalMs = POLL_INTERVAL_MS,
}: {
  apiKey: string;
  sessionId: string;
  timeoutSeconds: number;
  pollIntervalMs?: number;
}): Promise<NeuralvergeSessionStatus & { timed_out?: boolean }> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  for (;;) {
    const status = await getSessionStatus({ apiKey, sessionId });
    if (status.status === 'complete') {
      return status;
    }
    if (status.status === 'failed') {
      throw new Error(
        `NeuralVerge research task ${sessionId} failed: ${JSON.stringify(status.results ?? status)}`,
      );
    }
    if (Date.now() + pollIntervalMs > deadline) {
      return { ...status, session_id: sessionId, timed_out: true };
    }
    await sleep(pollIntervalMs);
  }
}

function pruneEmpty(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]): [string, unknown] => [
        key,
        isPlainObject(item) ? pruneEmpty(item) : item,
      ])
      .filter(([, item]) => !isEmpty(item)),
  );
}

function toStringList(value: unknown[] | undefined): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const list = value
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter((item) => item.length > 0);
  return list.length > 0 ? list : undefined;
}

function toSchemaString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }
  return JSON.stringify(value);
}

export const neuralvergeClient = {
  post,
  getSessionStatus,
  waitForSession,
  pruneEmpty,
  toStringList,
  toSchemaString,
};

export const NEURALVERGE_BASE_URL = 'https://api.neuralverge.ai/functions/v1';

async function send<T>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${NEURALVERGE_BASE_URL}/${endpoint}`,
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    throw new Error(describeError(error));
  }
}

function describeError(error: unknown): string {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const detail = JSON.stringify(error.response.body);
    const hint = STATUS_HINTS[status];
    return hint ? `${hint} (HTTP ${status}: ${detail})` : `NeuralVerge API error HTTP ${status}: ${detail}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return isPlainObject(value) && Object.keys(value).length === 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const POLL_INTERVAL_MS = 3000;

const STATUS_HINTS: Record<number, string> = {
  400: 'NeuralVerge rejected the request body. Check the input fields.',
  401: 'Invalid NeuralVerge API key. Copy a key from app.neuralverge.ai → Settings → API.',
  402: 'Your NeuralVerge plan or points limit has been reached.',
  502: 'The data source for this NeuralVerge endpoint is temporarily unavailable. Try again later.',
};

export type NeuralvergeEnvelope = {
  session_id: string;
  kind?: string;
  human?: string;
  machine?: Record<string, unknown> | null;
  total_points?: number;
  [key: string]: unknown;
};

export type NeuralvergeSessionStatus = {
  session_id: string;
  status: 'queued' | 'running' | 'complete' | 'failed' | string;
  results?: Record<string, unknown>;
};
