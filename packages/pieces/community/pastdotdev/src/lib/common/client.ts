import {
  HttpError,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

async function sendRequest<T extends HttpMessageBody>(
  request: PastDevRequest
): Promise<PastDevResponse<T>> {
  try {
    return await send<T>(request);
  } catch (error) {
    throw new Error(describeError({ error }));
  }
}

async function findRecord<T extends HttpMessageBody>(
  request: PastDevRequest
): Promise<PastDevResponse<T> | undefined> {
  try {
    return await send<T>(request);
  } catch (error) {
    if (error instanceof HttpError && ABSENT_STATUSES.includes(error.response.status)) {
      return undefined;
    }
    throw new Error(describeError({ error }));
  }
}

async function send<T extends HttpMessageBody>({
  connection,
  method,
  path,
  body,
  queryParams,
  redactBodyInErrors,
}: PastDevRequest): Promise<PastDevResponse<T>> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${resolveBaseUrl({ apiHost: connection.apiHost })}${path}`,
    headers: {
      Authorization: `Bearer ${connection.apiKey}`,
      Accept: 'application/json',
    },
    body,
    queryParams,
    redactBodyInErrors,
  });
  return {
    body: response.body,
    requestId: readRequestId({ headers: response.headers }),
  };
}

function resolveBaseUrl({ apiHost }: { apiHost: string | undefined }): string {
  const trimmed = (apiHost ?? '').trim().replace(/\/+$/, '');
  const host = trimmed.length === 0 ? DEFAULT_API_HOST : trimmed;
  return host.replace(/\/api\/v1$/, '');
}

function assertOnConnectionHost({
  urlProp,
  apiHost,
}: {
  urlProp: unknown;
  apiHost: string | undefined;
}): void {
  const url = readUrl({ urlProp });
  if (url === undefined) {
    throw new Error('Enter a URL, or a path on the API host of the connection.');
  }
  const baseUrl = resolveBaseUrl({ apiHost });
  const namesAHost = /^[a-z][a-z0-9+.-]*:/i.test(url) || /^[/\\]{2}/.test(url);
  if (namesAHost && !isSameOrigin({ url, baseUrl })) {
    throw new Error(
      `The URL must be on the API host of the connection (${baseUrl}). The API key is not sent to another host.`
    );
  }
}

function readUrl({ urlProp }: { urlProp: unknown }): string | undefined {
  if (typeof urlProp !== 'object' || urlProp === null) {
    return undefined;
  }
  if (!('url' in urlProp) || typeof urlProp.url !== 'string') {
    return undefined;
  }
  return urlProp.url.trim();
}

function isSameOrigin({ url, baseUrl }: { url: string; baseUrl: string }): boolean {
  try {
    return new URL(url, baseUrl).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function describeError({ error }: { error: unknown }): string {
  if (!(error instanceof HttpError)) {
    return `past dev could not be reached: ${error instanceof Error ? error.message : String(error)}`;
  }
  const { status, body } = error.response;
  const apiError = readApiError({ body });
  const code = apiError?.code ?? 'http-error';
  const message = apiError?.debugMessage ?? '';
  const hint = hintFor({ status, code });
  return [
    `past dev returned ${status} ${code}.`,
    message,
    hint,
  ]
    .filter((part) => part.length > 0)
    .join(' ');
}

function hintFor({ status, code }: { status: number; code: string }): string {
  if (status === 401) {
    return 'Check the API key of the connection. A project key starts with past_sk_.';
  }
  if (status === 402 || code === 'out-of-credits') {
    return 'The organization has no credits left. Do not run the step again until you buy credits or the credits reset.';
  }
  if (status === 429) {
    return 'The rate limit or the spend cap is reached. Wait before you run the step again.';
  }
  if (status === 404) {
    return 'past dev found no live record for this request.';
  }
  return '';
}

function readApiError({ body }: { body: unknown }): PastDevApiError | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  if (!('code' in body) || typeof body.code !== 'string') {
    return undefined;
  }
  const debugMessage =
    'debugMessage' in body && typeof body.debugMessage === 'string'
      ? body.debugMessage
      : undefined;
  return { code: body.code, debugMessage };
}

function readRequestId({
  headers,
}: {
  headers: Record<string, string | string[] | undefined> | undefined;
}): string | undefined {
  const value = headers?.['x-request-id'] ?? headers?.['X-Request-Id'];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function withoutEmpty(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        !(typeof value === 'string' && value.trim().length === 0)
    )
  );
}

const DEFAULT_API_HOST = 'https://api.past.dev';
const ABSENT_STATUSES = [400, 404];

export const pastDevClient = {
  sendRequest,
  findRecord,
  resolveBaseUrl,
  assertOnConnectionHost,
  describeError,
  withoutEmpty,
  DEFAULT_API_HOST,
};

export type PastDevConnection = {
  apiKey: string;
  apiHost?: string | undefined;
};

type PastDevRequest = {
  connection: PastDevConnection;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  redactBodyInErrors?: boolean;
};

type PastDevResponse<T> = {
  body: T;
  requestId: string | undefined;
};

type PastDevApiError = {
  code: string;
  debugMessage: string | undefined;
};
