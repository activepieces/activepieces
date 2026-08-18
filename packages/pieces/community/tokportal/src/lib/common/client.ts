import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import crypto from 'crypto';

export const TOKPORTAL_API_URL = 'https://app.tokportal.com/api/ext';
export const TOKPORTAL_CLIENT_HEADER = 'activepieces-tokportal/0.0.1';
export const TOKPORTAL_DOCS_URL = 'https://developers.tokportal.com';
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_SIGNATURE_TOLERANCE_SECONDS = 300;

export type QueryValue = string | number | boolean | string[] | undefined | null;

export type TokPortalApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

export type TokPortalPagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type TokPortalListResponse<T> = {
  data: T[];
  pagination?: TokPortalPagination;
};

function buildQueryString(query: Record<string, QueryValue> | undefined): string {
  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item));
          }
        }
        continue;
      }
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

export async function tokportalApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: TokPortalApiCallParams): Promise<T> {
  const queryString = buildQueryString(query);
  const url = queryString
    ? `${TOKPORTAL_API_URL}${resourceUri}?${queryString}`
    : `${TOKPORTAL_API_URL}${resourceUri}`;
  const emptyQueryParams: QueryParams = {};
  const request: HttpRequest = {
    method,
    url,
    headers: {
      'X-API-Key': apiKey,
      'X-TokPortal-Client': TOKPORTAL_CLIENT_HEADER,
      Accept: 'application/json',
    },
    queryParams: emptyQueryParams,
    body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function tokportalPaginatedApiCall<T>({
  apiKey,
  resourceUri,
  query,
  maxResults,
}: {
  apiKey: string;
  resourceUri: string;
  query?: Record<string, QueryValue>;
  maxResults?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await tokportalApiCall<TokPortalListResponse<T>>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri,
      query: {
        ...query,
        page,
        per_page: DEFAULT_PAGE_SIZE,
      },
    });
    const data = response.data ?? [];
    for (const item of data) {
      results.push(item);
      if (maxResults && results.length >= maxResults) {
        return results;
      }
    }
    if (data.length === 0) {
      break;
    }
    totalPages = response.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return results;
}

function parseSignatureHeader(header: string | undefined): {
  timestamp: string | null;
  signature: string | null;
} {
  const result: { timestamp: string | null; signature: string | null } = {
    timestamp: null,
    signature: null,
  };
  if (!header) {
    return result;
  }
  for (const part of header.split(',')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === 't') {
      result.timestamp = value;
    }
    if (key === 'v1') {
      result.signature = value;
    }
  }
  return result;
}

export function verifyTokPortalSignature({
  rawBody,
  signatureHeader,
  secret,
  toleranceSeconds = DEFAULT_SIGNATURE_TOLERANCE_SECONDS,
}: {
  rawBody: string | Buffer;
  signatureHeader: string | undefined;
  secret: string | undefined;
  toleranceSeconds?: number;
}): boolean {
  const { timestamp, signature } = parseSignatureHeader(signatureHeader);
  if (!timestamp || !signature || !secret) {
    return false;
  }
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const nowSeconds = Date.now() / 1000;
  if (toleranceSeconds > 0 && Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false;
  }
  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), bodyBuffer]);
  const digest = crypto.createHmac('sha256', secret).update(signedPayload).digest();
  try {
    const expected = Buffer.from(signature, 'hex');
    return expected.length === digest.length && crypto.timingSafeEqual(expected, digest);
  } catch {
    return false;
  }
}

export function rawBodyToString(rawBody: unknown, body: unknown): string {
  if (typeof rawBody === 'string') {
    return rawBody;
  }
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8');
  }
  return JSON.stringify(body ?? {});
}

export type TokPortalWebhookEnvelope = {
  id: string;
  type: string;
  api_version?: string;
  created_at?: string;
  data: Record<string, unknown>;
};

export const WEBHOOK_EVENTS = [
  'webhook.test',
  'bundle.created',
  'bundle.published',
  'bundle.cancelled',
  'bundle.archived',
  'account.configured',
  'account.in_review',
  'account.published',
  'account.pending_corrections',
  'account.finalized',
  'account.remade',
  'account.banned',
  'account.ban_appeal.submitted',
  'account.ban_appeal.resolved',
  'account.ban_resolution.decided',
  'account.revealed',
  'video.configured',
  'video.in_review',
  'video.published',
  'video.pending_corrections',
  'video.finalized',
  'warming.session_started',
  'warming.term_verified',
  'warming.session_completed',
  'subscription.renewed',
  'subscription.lapsed',
  'subscription.cancelled',
  'subscription.reactivated',
  'subscription.ended',
  'credits.restored',
];
