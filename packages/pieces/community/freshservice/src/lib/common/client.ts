import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { freshserviceAuth } from '../../';

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0]
    .replace(/\.freshservice\.com\.?$/, '')
    .replace(/\.+$/, '');
}

function buildBaseUrl(domain: string): string {
  return `https://${normalizeDomain(domain)}.freshservice.com/api/v2`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readHttpFailure(
  error: unknown
): { status: number; responseBody: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return null;
  }
  const status = response['status'];
  if (typeof status !== 'number') {
    return null;
  }
  return { status, responseBody: response['body'] };
}

function trimTrailingPunctuation(text: string): string {
  return text.trim().replace(/[.!;:,\s]+$/, '');
}

function describeVendorBody(responseBody: unknown): string | null {
  if (typeof responseBody === 'string') {
    const trimmed = trimTrailingPunctuation(responseBody);
    return trimmed.length > 0 && trimmed.length < 500 ? trimmed : null;
  }
  if (!isRecord(responseBody)) {
    return null;
  }
  const parts: string[] = [];
  const description = responseBody['description'] ?? responseBody['message'];
  if (typeof description === 'string' && description.trim().length > 0) {
    parts.push(trimTrailingPunctuation(description));
  }
  const errors = responseBody['errors'];
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (!isRecord(entry)) {
        continue;
      }
      const field = entry['field'];
      const message = entry['message'];
      if (typeof message !== 'string') {
        continue;
      }
      const text = trimTrailingPunctuation(message);
      parts.push(
        typeof field === 'string' && field.length > 0 ? `${field}: ${text}` : text
      );
    }
  }
  return parts.length > 0 ? parts.join('; ') : null;
}

function buildErrorMessage({
  status,
  responseBody,
}: {
  status: number;
  responseBody: unknown;
}): string {
  const vendor = describeVendorBody(responseBody);
  const base = `Freshservice request failed with status ${status}`;
  return vendor ? `${base}: ${vendor}` : base;
}

class FreshserviceApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({
    status,
    responseBody,
    message,
  }: {
    status: number;
    responseBody: unknown;
    message?: string;
  }) {
    super(message ?? buildErrorMessage({ status, responseBody }));
    this.name = 'FreshserviceApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isFreshserviceApiError(error: unknown): error is FreshserviceApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    Reflect.get(error, 'name') === 'FreshserviceApiError' &&
    typeof Reflect.get(error, 'status') === 'number'
  );
}

function readErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const message: unknown = Reflect.get(error, 'message');
    if (typeof message === 'string') {
      return message;
    }
  }
  return String(error);
}

function toFreshserviceError(error: unknown): unknown {
  const failure = readHttpFailure(error);
  if (!failure) {
    return error;
  }
  return new FreshserviceApiError(failure);
}

async function freshserviceRequest<T extends HttpMessageBody>({
  method,
  endpoint,
  domain,
  apiKey,
  body,
  queryParams,
}: {
  method: HttpMethod;
  endpoint: string;
  domain: string;
  apiKey: string;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
}): Promise<HttpResponse<T>> {
  const request: HttpRequest = {
    method,
    url: `${buildBaseUrl(domain)}/${endpoint}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: apiKey,
      password: 'X',
    },
    body,
    queryParams,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  try {
    return await httpClient.sendRequest<T>(request);
  } catch (error) {
    throw toFreshserviceError(error);
  }
}

async function freshserviceApiCall<T extends HttpMessageBody>({
  method,
  endpoint,
  auth,
  body,
  queryParams,
}: {
  method: HttpMethod;
  endpoint: string;
  auth: FreshserviceAuth;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
}): Promise<HttpResponse<T>> {
  return freshserviceRequest<T>({
    method,
    endpoint,
    domain: auth.props.domain,
    apiKey: auth.props.api_key,
    body,
    queryParams,
  });
}

async function freshserviceListPages<T>({
  auth,
  endpoint,
  key,
  queryParams,
  perPage = 100,
  maxPages = MAX_POLL_PAGES,
  allowTruncation = false,
  stopWhen,
}: {
  auth: FreshserviceAuth;
  endpoint: string;
  key: string;
  queryParams?: QueryParams;
  perPage?: number;
  maxPages?: number;
  allowTruncation?: boolean;
  stopWhen?: (pageItems: T[]) => boolean;
}): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const response = await freshserviceApiCall<Record<string, T[]>>({
      method: HttpMethod.GET,
      endpoint,
      auth,
      queryParams: {
        ...queryParams,
        per_page: String(perPage),
        page: String(page),
      },
    });
    const items = response.body[key] ?? [];
    results.push(...items);
    if (items.length < perPage || (stopWhen !== undefined && stopWhen(items))) {
      return results;
    }
  }
  if (!allowTruncation) {
    throw new Error(
      `More than ${maxPages * perPage} Freshservice records changed since the last poll. Nothing was emitted so no update is lost; narrow the trigger or try again later.`
    );
  }
  return results;
}

async function freshserviceDelete({
  auth,
  endpoint,
  resourceLabel,
}: {
  auth: FreshserviceAuth;
  endpoint: string;
  resourceLabel: string;
}): Promise<void> {
  try {
    await freshserviceApiCall({ method: HttpMethod.DELETE, endpoint, auth });
  } catch (error) {
    if (isFreshserviceApiError(error) && (error.status === 404 || error.status === 405)) {
      const vendor = describeVendorBody(error.responseBody);
      const message =
        error.status === 405
          ? `The ${resourceLabel} is already deleted (it is in the Freshservice trash) (status 405)`
          : `The ${resourceLabel} was not found; it may already be deleted (status 404${vendor ? `: ${vendor}` : ''})`;
      throw new FreshserviceApiError({
        status: error.status,
        responseBody: error.responseBody,
        message,
      });
    }
    throw error;
  }
}

function compactBody(
  entries: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entries).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
    )
  );
}

function pickFields({
  source,
  keys,
}: {
  source: Record<string, unknown>;
  keys: readonly string[];
}): Record<string, unknown> {
  return compactBody(Object.fromEntries(keys.map((key) => [key, source[key]])));
}

function hasMorePages({
  count,
  perPage,
}: {
  count: number;
  perPage: number;
}): boolean {
  return count >= perPage;
}

function clampPerPage(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 30;
  }
  return Math.min(Math.max(Math.floor(value), 1), 100);
}

function clampPage(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 1;
  }
  return Math.max(Math.floor(value), 1);
}

function reachedCreatedBefore<T extends { created_at: string }>({
  pageItems,
  epochMs,
}: {
  pageItems: T[];
  epochMs: number;
}): boolean {
  const times = pageItems.map((item) => new Date(item.created_at).getTime());
  const newestFirst = times.every((time, index) => index === 0 || time <= times[index - 1]);
  return newestFirst && times.length > 0 && times[times.length - 1] <= epochMs;
}

const MAX_POLL_PAGES = 200;
const REQUESTER_FILTER_PAGE_SIZE = 30;
const REQUESTER_FILTER_MAX_PAGES = 40;

export {
  buildBaseUrl,
  normalizeDomain,
  freshserviceApiCall,
  freshserviceRequest,
  freshserviceListPages,
  FreshserviceApiError,
  isFreshserviceApiError,
  readErrorMessage,
  buildErrorMessage,
  compactBody,
  freshserviceDelete,
  pickFields,
  hasMorePages,
  clampPerPage,
  clampPage,
  MAX_POLL_PAGES,
  REQUESTER_FILTER_PAGE_SIZE,
  REQUESTER_FILTER_MAX_PAGES,
  reachedCreatedBefore,
};

type FreshserviceAuth = AppConnectionValueForAuthProperty<typeof freshserviceAuth>;

export type { FreshserviceAuth };
