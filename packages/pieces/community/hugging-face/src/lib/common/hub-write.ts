import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { hfHub, QueryEntry } from './hub-client';
import { hfRepo } from './repo';

function buildWriteUrl({ path, query }: { path: string; query?: QueryEntry[] }): string {
  const search = new URLSearchParams();
  for (const [key, value] of query ?? []) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.append(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `${hfHub.baseUrl}${path}?${queryString}` : `${hfHub.baseUrl}${path}`;
}

function errorDetail(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 500) : null;
  }
  if (hfHub.isRecord(body)) {
    const error = body['error'];
    if (typeof error === 'string') {
      return error;
    }
    const message = body['message'];
    if (typeof message === 'string') {
      return message;
    }
  }
  return null;
}

function toWriteError({ error, resource, statusErrors }: ToWriteErrorParams): Error {
  if (!(error instanceof HttpError)) {
    return hfHub.toError({ error, resource });
  }
  return statusToWriteError({ status: error.response.status, body: error.response.body, resource, statusErrors });
}

function statusToWriteError({ status, body, resource, statusErrors }: StatusToWriteErrorParams): Error {
  const detail = errorDetail(body);
  const custom = statusErrors?.[status];
  if (custom) {
    return custom(detail);
  }
  const suffix = detail ? ` Details: ${detail}` : '';
  switch (status) {
    case 401:
      return new Error(
        `TOKEN_LACKS_WRITE_PERMISSION: Hugging Face refused the token (401) for ${resource}. Write actions need a token with the 'write' role, or a fine-grained token that grants write access to this repository or namespace. A read-only token fails here even though reads still work. Check the token role with Get Current User & Token.${suffix}`
      );
    case 403:
      return new Error(
        `TOKEN_LACKS_WRITE_PERMISSION: access denied (403) for ${resource}. The token lacks write permission on this resource (a read-role token, or a fine-grained token scoped to other repositories), or the account is not an owner/admin of it. Check the token role with Get Current User & Token.${suffix}`
      );
    case 409:
      return new Error(`CONFLICT: Hugging Face reported a conflict (409) for ${resource}.${suffix}`);
    default:
      return hfHub.toError({ error: new HttpError(undefined, { status, responseBody: body }), resource });
  }
}

function parseResponseText(text: string): unknown {
  if (text.length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

async function sensitiveWriteRequest({
  token,
  method,
  path,
  body,
  statusErrors,
}: SensitiveWriteRequestParams): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(buildWriteUrl({ path }), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SENSITIVE_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    throw new Error(`Could not reach Hugging Face for ${path} (${reason}). Retry in a moment.`);
  }
  const responseBody = parseResponseText(await response.text());
  if (!response.ok) {
    throw statusToWriteError({ status: response.status, body: responseBody, resource: path, statusErrors });
  }
  return responseBody;
}

async function sendWrite({
  token,
  method,
  path,
  query,
  body,
}: WriteRequestParams): Promise<HttpResponse<unknown>> {
  return httpClient.sendRequest<unknown>({
    method,
    url: buildWriteUrl({ path, query }),
    body,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
  });
}

async function writeRequest({
  statusErrors,
  ...params
}: WriteRequestParams & { statusErrors?: StatusErrors }): Promise<unknown> {
  try {
    const response = await sendWrite(params);
    return response.body;
  } catch (error) {
    throw toWriteError({ error, resource: params.path, statusErrors });
  }
}

async function createOrConflict(params: WriteRequestParams): Promise<CreateOutcome> {
  try {
    const response = await sendWrite(params);
    return { conflict: false, body: response.body };
  } catch (error) {
    if (error instanceof HttpError && error.response.status === 409) {
      return { conflict: true, body: error.response.body };
    }
    throw toWriteError({ error, resource: params.path });
  }
}

async function resolveDefaultBranch({ token, repo }: ResolveDefaultBranchParams): Promise<string> {
  const response = await hfHub.request<unknown>({
    token,
    method: HttpMethod.GET,
    path: `${repo.apiPath}/refs`,
  });
  const rawBranches = hfHub.isRecord(response.body) ? response.body['branches'] : undefined;
  const branches = (Array.isArray(rawBranches) ? rawBranches : [])
    .map((branch) => readString({ record: branch, key: 'name' }))
    .filter((name): name is string => name !== null);
  if (branches.includes(DEFAULT_BRANCH)) {
    return DEFAULT_BRANCH;
  }
  const listed = branches.length > 0 ? branches.map((name) => `'${name}'`).join(', ') : 'none';
  throw new Error(
    `BRANCH_REQUIRED: ${repo.repoId} has no '${DEFAULT_BRANCH}' branch, the Hub's default branch, so no branch can be assumed. Pass the branch explicitly. Existing branches: ${listed}.`
  );
}

async function currentUsername(token: string): Promise<string> {
  const response = await hfHub.request<unknown>({
    token,
    method: HttpMethod.GET,
    path: '/api/whoami-v2',
  });
  const name = hfHub.isRecord(response.body) ? response.body['name'] : undefined;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Could not read the username of the connected Hugging Face account from /api/whoami-v2.');
  }
  return name;
}

async function resolveRepo({ token, repoType, repoId }: ResolveRepoParams): Promise<ResolvedRepo> {
  const info = hfRepo.getTypeInfo(repoType);
  const canonical = await hfRepo.resolveRepoId({ token, repoType, repoId });
  return {
    repoId: canonical,
    repoType: info.singular,
    apiPath: `/api/${info.apiSegment}/${hfRepo.encodeRepoId(canonical)}`,
    webUrl: `${hfHub.baseUrl}/${info.resolvePrefix}${canonical}`,
  };
}

function requireText({ value, name, maxLength }: RequireTextParams): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${name} is required.`);
  }
  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new Error(`${name} must be at most ${maxLength} characters (got ${trimmed.length}).`);
  }
  return trimmed;
}

function optionalText({ value, name, maxLength }: RequireTextParams): string | undefined {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new Error(`${name} must be at most ${maxLength} characters (got ${trimmed.length}).`);
  }
  return trimmed;
}

function assertDiscussionNumber(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Discussion Number must be a positive whole number.');
  }
  return value;
}

function stripRefPrefix({ value, prefix }: { value: string; prefix: string }): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function assertSpaceKey(key: string): string {
  const trimmed = key.trim();
  if (!SPACE_KEY_PATTERN.test(trimmed)) {
    throw new Error(
      `Invalid key '${trimmed}'. Keys must start with a letter and contain only letters, digits and underscores, for example 'OPENAI_API_KEY'.`
    );
  }
  return trimmed;
}

function parseCollectionSlug(slug: string): string {
  const segments = slug
    .trim()
    .replace(/^https?:\/\/huggingface\.co\/collections\//, '')
    .split('/')
    .filter((segment) => segment.length > 0);
  if (segments.length !== 2) {
    throw new Error(
      "Invalid collection slug. Use the 'namespace/title-id' form, for example 'my-user/my-picks-66f448ffc8c32f949b04c8cf'."
    );
  }
  return segments.join('/');
}

function collectionApiPath(slug: string): string {
  return `/api/collections/${slug.split('/').map(encodeURIComponent).join('/')}`;
}

function readString({ record, key }: { record: unknown; key: string }): string | null {
  if (!hfHub.isRecord(record)) {
    return null;
  }
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

const SPACE_KEY_PATTERN = /^[a-zA-Z][_a-zA-Z0-9]*$/;
const DEFAULT_BRANCH = 'main';
const SENSITIVE_REQUEST_TIMEOUT_MS = 30000;

export const hfWrite = {
  request: writeRequest,
  sensitiveRequest: sensitiveWriteRequest,
  resolveDefaultBranch,
  createOrConflict,
  currentUsername,
  resolveRepo,
  requireText,
  optionalText,
  assertDiscussionNumber,
  stripRefPrefix,
  assertSpaceKey,
  parseCollectionSlug,
  collectionApiPath,
  readString,
};

export type StatusErrors = Partial<Record<number, (detail: string | null) => Error>>;

export type ResolvedRepo = {
  repoId: string;
  repoType: 'model' | 'dataset' | 'space';
  apiPath: string;
  webUrl: string;
};

type WriteRequestParams = {
  token: string;
  method: HttpMethod;
  path: string;
  query?: QueryEntry[];
  body?: unknown;
};

type ToWriteErrorParams = {
  error: unknown;
  resource: string;
  statusErrors?: StatusErrors;
};

type SensitiveWriteRequestParams = {
  token: string;
  method: HttpMethod.POST | HttpMethod.DELETE;
  path: string;
  body: Record<string, unknown>;
  statusErrors?: StatusErrors;
};

type StatusToWriteErrorParams = {
  status: number;
  body: unknown;
  resource: string;
  statusErrors?: StatusErrors;
};

type ResolveDefaultBranchParams = {
  token: string;
  repo: ResolvedRepo;
};

type CreateOutcome = { conflict: false; body: unknown } | { conflict: true; body: unknown };

type ResolveRepoParams = {
  token: string;
  repoType: string;
  repoId: string;
};

type RequireTextParams = {
  value: string | undefined | null;
  name: string;
  maxLength?: number;
};
