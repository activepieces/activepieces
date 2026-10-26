import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.tarvent.com';
const GRAPHQL_URL = `${BASE_URL}/graphql`;
const UNAUTHORIZED_PATTERN = /not authori[sz]ed to access|not authenticated/i;
const PERMISSION_CODE = '1070';
const INVALID_CREDENTIALS = 'Invalid Tarvent API key or account ID. Check both values in the connection.';
let verifiedTlsAgent: Promise<unknown> | undefined;

export class TarventApiError extends Error {
  constructor(
    message: string,
    public readonly code: string | undefined,
    public readonly status: number | undefined,
    public readonly responseBody: unknown,
    public readonly unauthorized = false,
  ) {
    super(message);
    this.name = 'TarventApiError';
  }

  get isUnauthorized(): boolean {
    return this.unauthorized;
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function authHeaders({ accountId, apiKey }: TarventCredentials): Record<string, string> {
  return {
    'x-api-key': String(apiKey ?? '').trim(),
    account: String(accountId ?? '').trim(),
  };
}

function graphqlErrors(body: unknown): { message: string; code?: string }[] {
  if (typeof body !== 'object' || body === null) {
    return [];
  }
  const errors: unknown = Reflect.get(body, 'errors');
  if (!Array.isArray(errors)) {
    return [];
  }
  return errors.map((error: unknown) => {
    const message: unknown = typeof error === 'object' && error !== null ? Reflect.get(error, 'message') : undefined;
    const extensions: unknown = typeof error === 'object' && error !== null ? Reflect.get(error, 'extensions') : undefined;
    const code: unknown = typeof extensions === 'object' && extensions !== null ? Reflect.get(extensions, 'code') : undefined;
    return {
      message: typeof message === 'string' && message.length > 0 ? message : 'Unknown error',
      code: typeof code === 'string' || typeof code === 'number' ? String(code) : undefined,
    };
  });
}

function toApiError({ status, body }: { status: number | undefined; body: unknown }): TarventApiError {
  const errors = graphqlErrors(body);
  const code = errors.find((error) => error.code !== undefined)?.code;
  if (status === 401 || status === 403 || errors.some((e) => UNAUTHORIZED_PATTERN.test(e.message))) {
    return new TarventApiError(INVALID_CREDENTIALS, code, status, body, true);
  }
  if (errors.some((e) => e.code === PERMISSION_CODE)) {
    return new TarventApiError(
      `The Tarvent API key does not have permission for this operation. In Tarvent, open Account -> API Keys and grant the key the permission it needs. Tarvent said: ${errors.map((e) => e.message).join('; ')}`,
      code,
      status,
      body,
    );
  }
  if (status === 429) {
    return new TarventApiError('Tarvent rate limit reached (HTTP 429). Try again in a few seconds.', code, status, body);
  }
  if (errors.length > 0) {
    const text = errors.map((e) => (e.code ? `${e.message} (code ${e.code})` : e.message)).join('; ');
    return new TarventApiError(`Tarvent returned an error: ${text}`, code, status, body);
  }
  return new TarventApiError(`Tarvent request failed${status ? ` (HTTP ${status})` : ''}.`, code, status, body);
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: Reflect.get(response, 'body') };
}

async function graphql<T>({
  auth,
  query,
  variables,
}: {
  auth: TarventCredentials;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  let body: GraphqlBody<T> | undefined;
  try {
    const response = await httpClient.sendRequest<GraphqlBody<T>>(
      {
        method: HttpMethod.POST,
        url: GRAPHQL_URL,
        headers: { ...authHeaders(auth), 'Content-Type': 'application/json', Accept: 'application/json' },
        body: { query, variables: variables ?? {} },
        redactBodyInErrors: true,
      },
      { dispatcher: await verifiedTls() },
    );
    body = response.body;
  } catch (error) {
    const failure = readHttpFailure(error);
    if (!failure) {
      throw error;
    }
    throw toApiError({ status: failure.status, body: failure.body });
  }
  if (graphqlErrors(body).length > 0) {
    throw toApiError({ status: 200, body });
  }
  const data = typeof body === 'object' && body !== null ? body.data : undefined;
  if (typeof data !== 'object' || data === null || data === undefined) {
    throw new TarventApiError('Tarvent returned an empty response.', undefined, 200, body);
  }
  return data;
}

async function field<T>({
  auth,
  query,
  variables,
  name,
}: {
  auth: TarventCredentials;
  query: string;
  variables?: Record<string, unknown>;
  name: string;
}): Promise<T> {
  const data = await graphql<Record<string, T | null | undefined>>({ auth, query, variables });
  const value = data[name];
  if (value === null || value === undefined) {
    throw new TarventApiError(`Tarvent returned no result for ${name}.`, undefined, 200, data);
  }
  return value;
}

export const tarventTransport = {
  graphql,
  field,
  authHeaders,
  verifiedTls,
  toApiError,
  graphqlErrors,
  baseUrl: BASE_URL,
  graphqlUrl: GRAPHQL_URL,
  invalidCredentialsMessage: INVALID_CREDENTIALS,
  permissionCode: PERMISSION_CODE,
};

type GraphqlBody<T> = { data?: T | null; errors?: unknown };

export type TarventCredentials = { accountId: string; apiKey: string };
