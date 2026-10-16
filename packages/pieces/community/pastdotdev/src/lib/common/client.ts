import {
  HttpError,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

async function sendRequest<T extends HttpMessageBody>({
  connection,
  method,
  path,
  body,
  queryParams,
  redactBodyInErrors,
}: PastDevRequest): Promise<PastDevResponse<T>> {
  try {
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
  } catch (error) {
    throw new Error(describeError({ error }));
  }
}

function resolveBaseUrl({ apiHost }: { apiHost: string | undefined }): string {
  const trimmed = (apiHost ?? '').trim().replace(/\/+$/, '');
  const host = trimmed.length === 0 ? DEFAULT_API_HOST : trimmed;
  return host.replace(/\/api\/v1$/, '');
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

export const pastDevClient = {
  sendRequest,
  resolveBaseUrl,
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
