import { Readable } from 'node:stream';
import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';

function buildUrl({ baseUrl, path, query }: BuildUrlParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of query ?? []) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.append(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
}

async function hubRequest<T>({
  token,
  method,
  path,
  query,
  body,
  baseUrl,
  anonymous,
}: HubRequestParams): Promise<HttpResponse<T>> {
  const url = buildUrl({ baseUrl: baseUrl ?? HUB_BASE_URL, path, query });
  try {
    return await httpClient.sendRequest<T>({
      method,
      url,
      body,
      authentication: anonymous ? undefined : { type: AuthenticationType.BEARER_TOKEN, token },
    });
  } catch (error) {
    throw toHubError({ error, resource: path });
  }
}

function extractErrorDetail(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 500) : null;
  }
  if (isRecord(body)) {
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

function rateLimitError(detail: string | null): Error {
  const match = detail?.match(/t=(\d+)/);
  const resetHint = match
    ? `Retry after about ${match[1]} seconds.`
    : 'Hub limits reset on fixed 5-minute windows, so retry in a few minutes.';
  return new Error(
    `Hugging Face rate limit reached (429). ${resetHint}${detail ? ` Details: ${detail}` : ''}`
  );
}

function toHubError({ error, resource }: ToHubErrorParams): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const detail = extractErrorDetail(error.response.body);
  const suffix = detail ? ` Details: ${detail}` : '';
  switch (status) {
    case 400:
    case 422:
      return new Error(`Hugging Face rejected the request (${status}) for ${resource}.${suffix}`);
    case 401:
      return new Error(
        `Hugging Face rejected the access token (401) for ${resource}. Check that the connection's token is valid and has not been revoked; private or gated repositories also answer 401 when the token cannot see them.${suffix}`
      );
    case 403:
      return new Error(
        `Access denied (403) for ${resource}. The token lacks permission for this resource (a fine-grained token may not cover it), or the repository is gated and this account has not been granted access.${suffix}`
      );
    case 404:
      return new Error(
        `Not found (404): ${resource}. Check the repository type, ID, revision and path; private repositories are only visible to tokens that can access them.${suffix}`
      );
    case 429:
      return rateLimitError(detail);
    default:
      return new Error(`Hugging Face request failed (${status}) for ${resource}.${suffix}`);
  }
}

function readHeader({ headers, name }: ReadHeaderParams): string | null {
  const value = headers?.[name.toLowerCase()];
  if (value === undefined) {
    return null;
  }
  return Array.isArray(value) ? value.join(', ') : value;
}

function parseNextLinkParam({ headers, param }: ParseNextLinkParams): string | null {
  const link = readHeader({ headers, name: 'link' });
  if (!link) {
    return null;
  }
  const match = link.match(/<([^>]+)>\s*;\s*rel="?next"?/);
  if (!match) {
    return null;
  }
  return new URL(match[1], HUB_BASE_URL).searchParams.get(param);
}

function parseNextCursor(headers: HttpHeaders | undefined): string | null {
  return parseNextLinkParam({ headers, param: 'cursor' });
}

async function readStreamWithCap({ stream, maxBytes }: ReadStreamParams): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buffer: Buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      stream.destroy();
      return null;
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function oversizeError({ url, size }: { url: string; size: number | null }): Error {
  const sizeText = size === null ? `more than ${MAX_TEXT_FILE_BYTES} bytes` : `${size} bytes`;
  return new Error(
    `FILE_TOO_LARGE: the file is ${sizeText}, above the ${MAX_TEXT_FILE_BYTES}-byte limit for Read Repo File. Download it directly instead: ${url}`
  );
}

function binaryError(url: string): Error {
  return new Error(
    `BINARY_FILE: the file is not UTF-8 text, so Read Repo File cannot return it. Download it directly instead: ${url}`
  );
}

function decodeText(buffer: Buffer): string | null {
  if (buffer.subarray(0, 8000).includes(0)) {
    return null;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

async function readRepoFileText({ token, url }: ReadRepoFileParams): Promise<RepoFileText> {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const sendAuth = new URL(currentUrl).host === HUB_HOST;
    let response: HttpResponse<Readable>;
    try {
      response = await httpClient.sendRequest<Readable>({
        method: HttpMethod.GET,
        url: currentUrl,
        followRedirects: false,
        responseType: 'stream',
        authentication: sendAuth ? { type: AuthenticationType.BEARER_TOKEN, token } : undefined,
      });
    } catch (error) {
      throw toHubError({ error, resource: new URL(currentUrl).pathname });
    }
    if (response.status >= 300 && response.status < 400) {
      response.body.destroy();
      const linkedSize = Number(readHeader({ headers: response.headers, name: 'x-linked-size' }));
      if (Number.isFinite(linkedSize) && linkedSize > MAX_TEXT_FILE_BYTES) {
        throw oversizeError({ url, size: linkedSize });
      }
      const location = readHeader({ headers: response.headers, name: 'location' });
      if (!location) {
        throw new Error(`Hugging Face answered ${response.status} without a redirect target for ${url}`);
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    const declaredLength = Number(readHeader({ headers: response.headers, name: 'content-length' }));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_TEXT_FILE_BYTES) {
      response.body.destroy();
      throw oversizeError({ url, size: declaredLength });
    }
    const buffer = await readStreamWithCap({ stream: response.body, maxBytes: MAX_TEXT_FILE_BYTES });
    if (buffer === null) {
      throw oversizeError({ url, size: null });
    }
    const content = decodeText(buffer);
    if (content === null) {
      throw binaryError(url);
    }
    return { content, sizeBytes: buffer.length };
  }
  throw new Error(`Too many redirects while downloading ${url}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const HUB_HOST = 'huggingface.co';
const HUB_BASE_URL = `https://${HUB_HOST}`;
const MAX_TEXT_FILE_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 5;

export const hfHub = {
  baseUrl: HUB_BASE_URL,
  maxTextFileBytes: MAX_TEXT_FILE_BYTES,
  request: hubRequest,
  toError: toHubError,
  parseNextCursor,
  parseNextLinkParam,
  readRepoFileText,
  isRecord,
};

export type QueryEntry = [string, string | number | boolean | undefined | null];

type BuildUrlParams = {
  baseUrl: string;
  path: string;
  query?: QueryEntry[];
};

type HubRequestParams = {
  token: string;
  method: HttpMethod;
  path: string;
  query?: QueryEntry[];
  body?: unknown;
  baseUrl?: string;
  anonymous?: boolean;
};

type ToHubErrorParams = {
  error: unknown;
  resource: string;
};

type ReadHeaderParams = {
  headers: HttpHeaders | undefined;
  name: string;
};

type ParseNextLinkParams = {
  headers: HttpHeaders | undefined;
  param: string;
};

type ReadStreamParams = {
  stream: Readable;
  maxBytes: number;
};

type ReadRepoFileParams = {
  token: string;
  url: string;
};

type RepoFileText = {
  content: string;
  sizeBytes: number;
};
