import {
  HttpError,
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const PUSHOVER_BASE_URL = 'https://api.pushover.net/1';

export const PUSHOVER_MAX_EMERGENCY_RETRIES = 50;
export const PUSHOVER_MIN_RETRY_SECONDS = 30;
export const PUSHOVER_MAX_EXPIRE_SECONDS = 10800;
export const PUSHOVER_MIN_PRIORITY = -2;
export const PUSHOVER_MAX_PRIORITY = 2;
export const PUSHOVER_MAX_ATTACHMENT_BYTES = 5242880;

const MAX_ERROR_DETAIL_LENGTH = 400;

const ERROR_BODY_METADATA_KEYS = new Set(['status', 'request', 'receipt']);

export async function pushoverApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  body,
  queryParams,
  errorHint,
}: PushoverApiCallParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${PUSHOVER_BASE_URL}${resourceUri}`,
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    throw new PushoverRequestError({
      message: describePushoverError({ error, errorHint }),
      status: error instanceof HttpError ? error.response.status : undefined,
      vendorErrors:
        error instanceof HttpError
          ? collectVendorErrors(error.response.body)
          : [],
      responseBody:
        error instanceof HttpError ? error.response.body : undefined,
    });
  }
}

export function buildMessageBody({
  apiToken,
  userKey,
  title,
  message,
  html,
  monospace,
  priority,
  retry,
  expire,
  ttl,
  url,
  urlTitle,
  timestamp,
  device,
  sound,
  tags,
  callback,
  attachmentBase64,
  attachmentType,
}: BuildMessageBodyParams): Record<string, unknown> {
  if (html === true && monospace === true) {
    throw new Error(
      'Pushover rejects html and monospace together: choose one message formatting mode.'
    );
  }
  const priorityNumber = isPresent(priority) ? Number(priority) : undefined;
  if (priorityNumber !== undefined && Number.isNaN(priorityNumber)) {
    throw new Error(
      `Priority must be a number between ${PUSHOVER_MIN_PRIORITY} and ${PUSHOVER_MAX_PRIORITY}.`
    );
  }
  if (
    priorityNumber !== undefined &&
    (priorityNumber < PUSHOVER_MIN_PRIORITY ||
      priorityNumber > PUSHOVER_MAX_PRIORITY)
  ) {
    throw new Error(
      `Priority must be a number between ${PUSHOVER_MIN_PRIORITY} and ${PUSHOVER_MAX_PRIORITY}.`
    );
  }
  if (priorityNumber === 2) {
    if (!isPresent(retry) || !isPresent(expire)) {
      throw new Error(
        `Emergency priority (2) requires both retry (>= ${PUSHOVER_MIN_RETRY_SECONDS} seconds) and expire (<= ${PUSHOVER_MAX_EXPIRE_SECONDS} seconds).`
      );
    }
    if (retry < PUSHOVER_MIN_RETRY_SECONDS) {
      throw new Error(
        `Emergency priority (2) requires retry to be at least ${PUSHOVER_MIN_RETRY_SECONDS} seconds.`
      );
    }
    if (expire < 1 || expire > PUSHOVER_MAX_EXPIRE_SECONDS) {
      throw new Error(
        `Emergency priority (2) requires expire between 1 and ${PUSHOVER_MAX_EXPIRE_SECONDS} seconds.`
      );
    }
  }
  if (isPresent(attachmentBase64) && !isPresent(attachmentType)) {
    throw new Error(
      'attachment_type (for example image/jpeg) is required whenever an attachment is supplied.'
    );
  }
  if (
    isPresent(attachmentBase64) &&
    Math.floor((attachmentBase64.length * 3) / 4) > PUSHOVER_MAX_ATTACHMENT_BYTES
  ) {
    throw new Error(
      `The attachment decodes to more than the Pushover limit of ${PUSHOVER_MAX_ATTACHMENT_BYTES} bytes (5 MB). Resize or recompress the image before sending.`
    );
  }

  return {
    token: apiToken,
    user: userKey,
    message,
    ...spreadWhenPresent({ title }),
    ...spreadWhenPresent({ url }),
    ...spreadWhenPresent({ url_title: urlTitle }),
    ...spreadWhenPresent({ timestamp }),
    ...spreadWhenPresent({ device }),
    ...spreadWhenPresent({ callback }),
    ...spreadWhenPresent({ tags }),
    ...spreadWhenPresent({ sound }),
    ...spreadWhenPresent({ attachment_base64: attachmentBase64 }),
    ...spreadWhenPresent({ attachment_type: attachmentType }),
    ...(html === true ? { html: 1 } : {}),
    ...(monospace === true ? { monospace: 1 } : {}),
    ...(priorityNumber !== undefined ? { priority: priorityNumber } : {}),
    ...(priorityNumber === 2 ? { retry, expire } : {}),
    ...(priorityNumber !== 2 && isPresent(ttl) ? { ttl } : {}),
  };
}

function isPresent<T>(value: T | undefined | null): value is T {
  if (value === undefined || value === null) {
    return false;
  }
  return typeof value === 'string' ? value.length > 0 : true;
}

function spreadWhenPresent(
  entry: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entry).filter(([, value]) => isPresent(value))
  );
}

function truncateDetail(detail: string): string {
  return detail.length > MAX_ERROR_DETAIL_LENGTH
    ? `${detail.slice(0, MAX_ERROR_DETAIL_LENGTH)}...`
    : detail;
}

function flattenErrorValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value.trim()] : [];
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenErrorValue);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, nested]) =>
      flattenErrorValue(nested).map((entry) => `${key}: ${entry}`)
    );
  }
  return [];
}

function collectVendorErrors(body: unknown): string[] {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  if (typeof body !== 'object' || body === null) {
    return [];
  }
  const listedErrors = flattenErrorValue(
    'errors' in body ? body.errors : undefined
  );
  const fieldErrors = Object.entries(body)
    .filter(([key]) => key !== 'errors' && !ERROR_BODY_METADATA_KEYS.has(key))
    .flatMap(([key, value]) =>
      flattenErrorValue(value).map((entry) => `${key}: ${entry}`)
    );
  return [...listedErrors, ...fieldErrors];
}

function readVendorErrors(body: unknown): string {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 0
      ? ` Pushover said: ${truncateDetail(trimmed)}.`
      : '';
  }
  if (typeof body !== 'object' || body === null) {
    return '';
  }

  const listedErrors = flattenErrorValue(
    'errors' in body ? body.errors : undefined
  );
  const fieldErrors = Object.entries(body)
    .filter(([key]) => key !== 'errors' && !ERROR_BODY_METADATA_KEYS.has(key))
    .flatMap(([key, value]) =>
      typeof value === 'string' && value.trim().length > 0
        ? [`${key}: ${value.trim()}`]
        : []
    );
  const messages = [...listedErrors, ...fieldErrors];
  if (messages.length > 0) {
    return ` Pushover said: ${truncateDetail(messages.join('; '))}.`;
  }

  return ` Pushover returned this body: ${truncateDetail(JSON.stringify(body))}.`;
}

function describePushoverError({
  error,
  errorHint,
}: DescribeErrorParams): string {
  const hint = isPresent(errorHint) ? ` ${errorHint}` : '';
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const status = error.response.status;
  const vendorErrors = readVendorErrors(error.response.body);
  if (status === 429) {
    return `Pushover returned 429: the application monthly message quota is exhausted, not a transient rate limit. Check Get Monthly Message Limits for the reset date.${vendorErrors}`;
  }
  if (status >= 500) {
    return `Pushover returned ${status}. This class is retryable, but wait at least 5 seconds before trying again.${vendorErrors}`;
  }
  if (status >= 400) {
    return `Pushover returned ${status}. 4xx responses are terminal: retrying the same request will fail again, and repeated bad requests can get the IP temporarily blocked. Fix the input first.${hint}${vendorErrors}`;
  }
  return `Pushover request failed with status ${status}.${vendorErrors}`;
}

export class PushoverRequestError extends Error {
  readonly status: number | undefined;
  readonly vendorErrors: string[];
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    vendorErrors,
    responseBody,
  }: PushoverRequestErrorParams) {
    super(message);
    this.name = 'PushoverRequestError';
    this.status = status;
    this.vendorErrors = vendorErrors;
    this.responseBody = responseBody;
  }
}

export const GROUP_OWNERSHIP_HINT =
  'The Groups API requires the application token to belong to the same account that owns the group, so an ownership mismatch reports the same way as an unknown group key.';

export type PushoverApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
  errorHint?: string;
};

export type BuildMessageBodyParams = {
  apiToken: string;
  userKey: string;
  message: string;
  title?: string;
  html?: boolean;
  monospace?: boolean;
  priority?: number | string;
  retry?: number;
  expire?: number;
  ttl?: number;
  url?: string;
  urlTitle?: string;
  timestamp?: string;
  device?: string;
  sound?: string;
  tags?: string;
  callback?: string;
  attachmentBase64?: string;
  attachmentType?: string;
};

export type DescribeErrorParams = {
  error: unknown;
  errorHint?: string;
};

export type PushoverRequestErrorParams = {
  message: string;
  status: number | undefined;
  vendorErrors: string[];
  responseBody: unknown;
};
