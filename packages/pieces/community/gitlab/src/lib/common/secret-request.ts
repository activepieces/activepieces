import type { Dispatcher } from 'undici';
import { GITLAB_API_BASE } from './constants';

const DEFAULT_TIMEOUT_MS = 60_000;

let verifiedTlsAgent: Promise<Dispatcher> | undefined;

function getVerifiedTlsAgent(): Promise<Dispatcher> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export class GitlabApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'GitlabApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function vendorMessage(responseBody: unknown): string | undefined {
  if (typeof responseBody === 'string') {
    const trimmed = responseBody.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 500) : undefined;
  }
  if (!isRecord(responseBody)) {
    return undefined;
  }
  const record = responseBody;
  const raw =
    record['message'] ?? record['error_description'] ?? record['error'];
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  return JSON.stringify(raw).slice(0, 500);
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: 'GitLab rejected the request as invalid',
  401: 'GitLab rejected the access token. Reconnect the GitLab connection',
  403: 'The connected GitLab user does not have permission for this operation (check the role on the project or group)',
  404: 'GitLab could not find the resource, or the connected user cannot see it',
  408: 'GitLab timed out answering the request. Narrow it (for example set a project or more filters) and retry',
  405: 'GitLab does not allow this operation on the resource in its current state',
  409: 'GitLab reported a conflict with the current state of the resource',
  422: 'GitLab could not process the request',
  429: 'GitLab rate limit reached. Retry later',
};

export function buildGitlabError({
  status,
  responseBody,
  statusMessages,
}: {
  status: number;
  responseBody: unknown;
  statusMessages?: Partial<Record<number, string>>;
}): GitlabApiError {
  const base =
    statusMessages?.[status] ??
    DEFAULT_STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'GitLab returned a server error. Retry later'
      : 'GitLab request failed');
  const detail = vendorMessage(responseBody);
  const message =
    detail === undefined
      ? `${base} (HTTP ${status}).`
      : `${base} (HTTP ${status}): ${detail}`;
  return new GitlabApiError({ message, status, responseBody });
}

type JsonValue = ReturnType<typeof JSON.parse>;

export function buildGitlabUrl({
  path,
  query,
}: {
  path: string;
  query?: Record<string, GitlabQueryValue>;
}): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('/../') ||
    path.endsWith('/..')
  ) {
    throw new Error(
      `Refusing to send a GitLab request to an unexpected path: ${path}`
    );
  }
  const url = new URL(GITLAB_API_BASE + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          continue;
        }
        for (const item of value) {
          url.searchParams.append(`${key}[]`, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readBody(response: Response): Promise<JsonValue> {
  if (response.status === 204 || response.body === null) {
    return undefined;
  }
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

async function openGitlabResponse({
  request,
  accept,
}: {
  request: GitlabRequest;
  accept: string;
}): Promise<Response> {
  const url = buildGitlabUrl({ path: request.path, query: request.query });
  const headers: Record<string, string> = {
    Authorization: `Bearer ${request.token}`,
    Accept: accept,
  };
  let payload: string | undefined;
  if (request.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(request.body);
  }
  const dispatcher = await gitlabTransport.getDispatcher();
  const init: RequestInit & { dispatcher: Dispatcher } = {
    method: request.method,
    headers,
    body: payload,
    redirect: 'manual',
    signal: AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    dispatcher,
  };
  const response = await fetch(url, init);
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw new GitlabApiError({
      message: `GitLab answered with an unexpected redirect (HTTP ${response.status}); the request was not followed.`,
      status: response.status,
      responseBody: undefined,
    });
  }
  if (!response.ok) {
    throw buildGitlabError({
      status: response.status,
      responseBody: await readBody(response),
      statusMessages: request.statusMessages,
    });
  }
  return response;
}

export async function sendGitlabRequest<T>(
  request: GitlabRequest
): Promise<GitlabResponse<T>> {
  const response = await openGitlabResponse({
    request,
    accept: 'application/json',
  });
  const body = await readBody(response);
  return {
    status: response.status,
    headers: response.headers,
    body,
  };
}

export async function readGitlabRawPrefix({
  request,
  maxBytes,
}: {
  request: GitlabRequest;
  maxBytes: number;
}): Promise<{ bytes: Buffer; complete: boolean }> {
  const response = await openGitlabResponse({
    request,
    accept: 'application/octet-stream',
  });
  if (response.body === null) {
    return { bytes: Buffer.alloc(0), complete: true };
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let length = 0;
  let complete = true;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const room = maxBytes - length;
    if (value.byteLength > room) {
      chunks.push(Buffer.from(value.subarray(0, room)));
      length += room;
      complete = false;
      await reader.cancel();
      break;
    }
    chunks.push(Buffer.from(value));
    length += value.byteLength;
  }
  return { bytes: Buffer.concat(chunks, length), complete };
}

export const gitlabTransport = {
  getDispatcher: getVerifiedTlsAgent,
};

export type GitlabQueryValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Array<string | number>;

export type GitlabRequest = {
  token: string;
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, GitlabQueryValue>;
  body?: unknown;
  statusMessages?: Partial<Record<number, string>>;
  timeoutMs?: number;
};

export type GitlabResponse<T> = {
  status: number;
  headers: Headers;
  body: T;
};
