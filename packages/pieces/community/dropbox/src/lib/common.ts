import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

const API_HOST = 'https://api.dropboxapi.com/2';
const CONTENT_HOST = 'https://content.dropboxapi.com/2';

export const dropboxCommon = {
  CONTENT_HOST,
  rpc,
  download,
  unwrapEntry,
  previewExtensionFor,
  parseStringArray,
  parseRelocationEntries,
};

function encodeApiArg(arg: unknown): string {
  return JSON.stringify(arg).replace(
    /[\u007f-￿]/g,
    (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4)
  );
}

function describeError(error: unknown): string | undefined {
  if (!isObject(error)) {
    return undefined;
  }
  const response = error['response'];
  if (!isObject(response)) {
    return undefined;
  }
  const body = response['body'];
  const summary =
    isObject(body) && 'error_summary' in body
      ? String(body['error_summary'])
      : undefined;
  switch (response['status']) {
    case 401:
      return 'Dropbox rejected the credentials. Reconnect the Dropbox connection.';
    case 403:
      return `Dropbox denied this request. The connection may lack the required scope, or the account plan may not include this feature. ${
        summary ?? ''
      }`.trim();
    case 409:
      return `Dropbox could not complete the request: ${
        summary ?? 'the path or resource is in an unexpected state.'
      }`;
    case 429:
      return 'Dropbox rate limit reached. Retry after a short delay.';
    default:
      return summary;
  }
}

async function rpc<T>({
  auth,
  path,
  body,
  host = API_HOST,
}: {
  auth: string;
  path: string;
  body: unknown;
  host?: string;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod.POST,
      url: `${host}${path}`,
      ...(body === null
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body }),
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
    });
    return response.body;
  } catch (error) {
    const message = describeError(error);
    if (message !== undefined) {
      throw new Error(message);
    }
    throw error;
  }
}

async function download<TResult>({
  auth,
  path,
  arg,
}: {
  auth: string;
  path: string;
  arg: unknown;
}): Promise<{
  data: Buffer;
  result: TResult | undefined;
  contentType: string | undefined;
}> {
  try {
    const response = await httpClient.sendRequest<Buffer>({
      method: HttpMethod.POST,
      url: `${CONTENT_HOST}${path}`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': encodeApiArg(arg),
      },
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
      responseType: 'stream',
    });
    const header = response.headers?.['dropbox-api-result'];
    const contentType = response.headers?.['content-type'];
    return {
      data: response.body,
      result: typeof header === 'string' ? JSON.parse(header) : undefined,
      contentType:
        typeof contentType === 'string'
          ? contentType.split(';')[0].trim()
          : undefined,
    };
  } catch (error) {
    const message = describeError(error);
    if (message !== undefined) {
      throw new Error(message);
    }
    throw error;
  }
}

function unwrapEntry({
  entries,
  action,
}: {
  entries: unknown;
  action: string;
}): unknown {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`Dropbox returned no result entry for ${action}.`);
  }
  const entry: unknown = entries[0];
  if (isObject(entry) && entry['.tag'] === 'failure') {
    throw new Error(
      `Dropbox could not ${action}: ${JSON.stringify(entry['failure'])}`
    );
  }
  return entry;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function previewExtensionFor(contentType: string | undefined): string {
  return contentType === 'text/html' ? 'html' : 'pdf';
}

function toArray({
  value,
  displayName,
}: {
  value: unknown;
  displayName: string;
}): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      throw new Error(`${displayName} must be a list.`);
    }
  }
  throw new Error(`${displayName} must be a list.`);
}

function parseStringArray({
  value,
  displayName,
}: {
  value: unknown;
  displayName: string;
}): string[] {
  const items = toArray({ value, displayName });
  const strings = items.filter(isNonEmptyString);
  if (strings.length !== items.length) {
    throw new Error(
      `Every entry in ${displayName} must be a non-empty text value.`
    );
  }
  return strings;
}

function parseRelocationEntries({
  value,
  displayName,
}: {
  value: unknown;
  displayName: string;
}): RelocationEntry[] {
  const items = toArray({ value, displayName });
  const entries = items.filter(isRelocationEntry);
  if (entries.length !== items.length) {
    throw new Error(
      `Every entry in ${displayName} must have a From Path and a To Path.`
    );
  }
  return entries.map((entry) => ({
    from_path: entry.from_path,
    to_path: entry.to_path,
  }));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRelocationEntry(value: unknown): value is RelocationEntry {
  return (
    isObject(value) &&
    isNonEmptyString(value['from_path']) &&
    isNonEmptyString(value['to_path'])
  );
}

type RelocationEntry = {
  from_path: string;
  to_path: string;
};
