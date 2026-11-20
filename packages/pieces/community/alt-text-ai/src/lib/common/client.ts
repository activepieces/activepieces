import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

async function altTextAiRequest(params: AltTextAiRequestParams): Promise<unknown> {
  const { body } = await altTextAiRequestWithHeaders(params);
  return body;
}

async function altTextAiRequestWithHeaders({
  apiKey,
  method,
  path,
  operation,
  body,
  queryParams,
}: AltTextAiRequestParams): Promise<{ body: unknown; headers: Record<string, unknown> }> {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      body,
      queryParams,
    });
    return { body: response.body, headers: isRecord(response.headers) ? response.headers : {} };
  } catch (error) {
    throw toAltTextAiError({ error, operation, method, path });
  }
}

function readPaging({ page, limit }: { page: number | null | undefined; limit: number | null | undefined }): {
  pageNumber: number;
  pageSize: number;
} {
  const pageNumber = page === undefined || page === null ? 1 : Math.trunc(page);
  const pageSize = limit === undefined || limit === null ? 20 : Math.trunc(limit);
  if (pageNumber < 1) {
    throw new Error('Page must be 1 or greater.');
  }
  if (pageSize < 1 || pageSize > MAX_PAGE_LIMIT) {
    throw new Error(`Limit must be between 1 and ${MAX_PAGE_LIMIT}.`);
  }
  return { pageNumber, pageSize };
}

function headerNumber({ headers, name }: { headers: Record<string, unknown>; name: string }): number | null {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  if (!entry) return null;
  const value = Array.isArray(entry[1]) ? entry[1][0] : entry[1];
  const parsed = asNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function buildImagePage({
  body,
  headers,
  pageNumber,
  pageSize,
}: {
  body: unknown;
  headers: Record<string, unknown>;
  pageNumber: number;
  pageSize: number;
}): AltTextAiImagePage {
  const images = extractImageList(body).map((item) => normalizeImage(item));
  const currentPage = headerNumber({ headers, name: 'current-page' }) ?? pageNumber;
  const totalPages = headerNumber({ headers, name: 'total-pages' });
  const totalCount = headerNumber({ headers, name: 'total-count' });
  let nextPage: number | null;
  if (totalPages !== null) {
    nextPage = currentPage < totalPages ? currentPage + 1 : null;
  } else {
    nextPage = images.length >= pageSize ? currentPage + 1 : null;
  }
  return {
    images,
    count: images.length,
    page: currentPage,
    next_page: nextPage,
    total_count: totalCount,
    total_pages: totalPages,
  };
}

function toAltTextAiError({
  error,
  operation,
  method,
  path,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
  path: string;
}): AltTextAiError {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const vendorBody = error.response.body;
    const errorCode = extractErrorCode(vendorBody);
    const vendorMessage = extractVendorMessage(vendorBody);
    const hint = errorCode ? ERROR_CODE_HINTS[errorCode] : undefined;
    const label = errorCode ? `${status}, ${errorCode}` : String(status);
    const parts: string[] = [];
    if (status === 429) parts.push('rate limited, wait and try again');
    if (status === 401 || status === 403) parts.push('the API key is invalid or lacks access');
    if (vendorMessage) parts.push(vendorMessage);
    if (hint) parts.push(hint);
    if (status === 404 && isSingleImagePath(path)) parts.push('no image with this asset ID exists (check the ID, or it was already deleted)');
    return new AltTextAiError({
      message: `AltText.ai ${operation} failed (${label})${parts.length > 0 ? `: ${parts.join(' — ')}` : ''}`,
      statusCode: status,
      responseBody: vendorBody,
    });
  }
  const detail = error instanceof Error ? error.message : String(error);
  const mayHaveApplied = method === HttpMethod.GET ? '' : ' The request may still have been applied.';
  return new AltTextAiError({
    message: `AltText.ai ${operation} failed: network error (${detail}).${mayHaveApplied}`,
    statusCode: 0,
    responseBody: undefined,
  });
}

function isSingleImagePath(path: string): boolean {
  return /^\/images\/[^/]+$/.test(path) && path !== '/images/search';
}

function extractErrorCode(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const code = body['error_code'];
  return typeof code === 'string' && code.length > 0 ? code : null;
}

function flattenErrors(value: unknown): string[] {
  if (typeof value === 'string') return value.length > 0 ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenErrors(item));
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) =>
      flattenErrors(item).map((text) => (key === 'base' ? text : `${key} ${text}`)),
    );
  }
  if (typeof value === 'number') return [String(value)];
  return [];
}

function extractVendorMessage(body: unknown): string {
  if (typeof body === 'string') {
    return body.slice(0, 500);
  }
  if (!isRecord(body)) {
    return '';
  }
  const messages = [...flattenErrors(body['error']), ...flattenErrors(body['message']), ...flattenErrors(body['errors'])];
  return [...new Set(messages)].join('; ').slice(0, 500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function normalizeImage(raw: unknown): AltTextAiImage {
  const record = isRecord(raw) ? raw : {};
  const altTexts: Record<string, string> = {};
  if (isRecord(record['alt_texts'])) {
    for (const [lang, text] of Object.entries(record['alt_texts'])) {
      const value = asString(text);
      if (value !== null) altTexts[lang] = value;
    }
  }
  const tags = Array.isArray(record['tags'])
    ? record['tags'].map((tag) => asString(tag)).filter((tag): tag is string => tag !== null)
    : [];
  return {
    asset_id: asString(record['asset_id']),
    url: asString(record['url']),
    alt_text: asString(record['alt_text']),
    alt_texts: altTexts,
    tags,
    metadata: isRecord(record['metadata']) ? record['metadata'] : {},
    created_at: asNumber(record['created_at']),
    errors: record['errors'] ?? null,
    error_code: asString(record['error_code']),
  };
}

function extractImageList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  for (const key of ['images', 'data', 'results']) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function stripDataUriPrefix(base64: string): string {
  const match = /^data:[^;,]*;base64,/i.exec(base64);
  return match ? base64.slice(match[0].length) : base64;
}

function requireAssetId(value: string | undefined): string {
  const assetId = (value ?? '').trim();
  if (assetId === '') {
    throw new Error('Asset ID cannot be empty.');
  }
  return assetId;
}

function nonEmptyStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item): item is string => item !== null && item.trim() !== '')
    .map((item) => item.trim());
}

const ERROR_CODE_HINTS: Record<string, string> = {
  download_failed: 'AltText.ai could not download the image URL',
  insufficient_credits: 'the account has no credits left',
  rate_limited: 'too many requests, wait and try again',
};

class AltTextAiError extends Error {
  readonly statusCode: number;
  readonly responseBody: unknown;
  constructor({ message, statusCode, responseBody }: { message: string; statusCode: number; responseBody: unknown }) {
    super(message);
    this.name = 'AltTextAiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

type AltTextAiImage = {
  asset_id: string | null;
  url: string | null;
  alt_text: string | null;
  alt_texts: Record<string, string>;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: number | null;
  errors: unknown;
  error_code: string | null;
};

const MAX_PAGE_LIMIT = 100;

type AltTextAiRequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
};

type AltTextAiImagePage = {
  images: AltTextAiImage[];
  count: number;
  page: number;
  next_page: number | null;
  total_count: number | null;
  total_pages: number | null;
};

export {
  altTextAiRequest,
  altTextAiRequestWithHeaders,
  readPaging,
  buildImagePage,
  MAX_PAGE_LIMIT,
  AltTextAiError,
  normalizeImage,
  extractImageList,
  stripDataUriPrefix,
  nonEmptyStrings,
  requireAssetId,
  isRecord,
  asString,
  asNumber,
  toAltTextAiError,
};
export type { AltTextAiImage, AltTextAiImagePage };
