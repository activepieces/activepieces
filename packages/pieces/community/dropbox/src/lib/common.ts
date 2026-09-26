import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

const API_HOST = 'https://api.dropboxapi.com/2';
const CONTENT_HOST = 'https://content.dropboxapi.com/2';

function encodeApiArg(arg: unknown): string {
  return JSON.stringify(arg).replace(
    /[\u007f-￿]/g,
    (c) => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4)
  );
}

function describeError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const response = (error as { response?: { status?: number; body?: unknown } })
    .response;
  if (response === undefined) {
    return undefined;
  }
  const summary =
    typeof response.body === 'object' &&
    response.body !== null &&
    'error_summary' in response.body
      ? String((response.body as { error_summary: unknown }).error_summary)
      : undefined;
  switch (response.status) {
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
  if (
    isObject(entry) &&
    entry['.tag'] === 'failure'
  ) {
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

export const dropboxCommon = {
  CONTENT_HOST,
  rpc,
  download,
  unwrapEntry,
  previewExtensionFor,
};
