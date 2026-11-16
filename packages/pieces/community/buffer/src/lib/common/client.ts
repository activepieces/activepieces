import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BUFFER_API_URL = 'https://api.buffer.com';
const REQUEST_TIMEOUT_MS = 60000;
const MAX_ERROR_TEXT = 500;

let verifiedTlsAgent: Promise<unknown> | undefined;

class BufferApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, code, responseBody }: { message: string; status: number; code: string | undefined; responseBody: unknown }) {
    super(message);
    this.name = 'BufferApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }),
  );
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function clip(text: string): string {
  return text.length > MAX_ERROR_TEXT ? `${text.slice(0, MAX_ERROR_TEXT)}…` : text;
}

function graphqlErrorsOf(body: unknown): GraphQLErrorEntry[] {
  if (!isRecord(body) || !Array.isArray(body['errors'])) return [];
  return body['errors'].filter(isRecord).map((entry) => {
    const extensions = isRecord(entry['extensions']) ? entry['extensions'] : {};
    return {
      message: textOf(entry['message']) ?? 'Unknown error',
      code: textOf(extensions['code']),
      window: textOf(extensions['window']),
    };
  });
}

function hintFor({ status, code, window }: { status: number; code: string | undefined; window: string | undefined }): string | undefined {
  if (status === 401 || code === 'UNAUTHENTICATED' || code === 'UNAUTHORIZED') {
    return 'Check the API key on the Buffer connection. Create a new key in Buffer under Settings → API (https://publish.buffer.com/settings/api) if it was revoked.';
  }
  if (code === 'FORBIDDEN' || status === 403) {
    return 'The account behind this API key has no access to that organization, channel or post.';
  }
  if (status === 429 || code === 'RATE_LIMIT_EXCEEDED') {
    return `Buffer's request limit for the ${window ?? 'current'} window is used up. All API keys and MCP connections on the account share it. Wait for the window to reset before trying again.`;
  }
  if (code === 'PAGINATION_LIMIT_EXCEEDED') {
    return 'Ask for at most 100 items per page.';
  }
  return undefined;
}

function toApiError({ status, body, operation }: { status: number; body: unknown; operation: string }): BufferApiError {
  const errors = graphqlErrorsOf(body);
  const first = errors[0];
  const code = first?.code;
  const head = `Buffer could not ${operation} (HTTP ${status}${code === undefined ? '' : ` ${code}`})`;
  const vendorText = errors.length > 0
    ? errors.map((entry) => entry.message).join('; ')
    : typeof body === 'string'
      ? textOf(body)
      : undefined;
  const hint = hintFor({ status, code, window: first?.window });
  const parts = [
    vendorText === undefined ? `${head}.` : `${head}: ${clip(vendorText)}`,
    hint,
  ].filter((part): part is string => part !== undefined);
  return new BufferApiError({ message: parts.join(' '), status, code, responseBody: body });
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function isAbort(error: unknown): boolean {
  if (error === null || typeof error !== 'object') return false;
  const name = Reflect.get(error, 'name');
  return name === 'AbortError' || name === 'TimeoutError';
}

function rootsAreSet(data: Record<string, unknown>): boolean {
  const values = Object.values(data);
  return values.length > 0 && values.every((value) => value !== null && value !== undefined);
}

async function graphqlRequest<T extends Record<string, unknown>>({
  accessToken,
  query,
  variables,
  operation,
}: {
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
  operation?: string;
}): Promise<T> {
  const action = operation ?? 'complete the request';
  const key = accessToken.trim();
  if (key === '') {
    throw new Error('The Buffer connection has no API key. Reconnect it with a key from Buffer under Settings → API.');
  }
  const dispatcher = await verifiedTls();
  let body: GraphQLResponse<T> | undefined;
  let status: number;
  try {
    const response = await httpClient.sendRequest<GraphQLResponse<T>>(
      {
        method: HttpMethod.POST,
        url: BUFFER_API_URL,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: { query, variables: variables ?? {} },
        timeout: REQUEST_TIMEOUT_MS,
        retries: 0,
        redactBodyInErrors: true,
      },
      { dispatcher },
    );
    body = response.body;
    status = response.status;
  } catch (error) {
    const failure = failureOf(error);
    if (failure !== null) {
      throw toApiError({ ...failure, operation: action });
    }
    if (isAbort(error)) {
      throw new Error(`Buffer did not answer within ${REQUEST_TIMEOUT_MS / 1000} s while trying to ${action}. The call was not retried. If it was a create or edit, check the post in Buffer before running it again, because it may already have been saved.`);
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Buffer could not ${action}: could not reach api.buffer.com (${clip(reason)}).`);
  }
  if (!isRecord(body)) {
    throw new BufferApiError({ message: `Buffer could not ${action} (HTTP ${status}): the response was not a JSON object.`, status, code: undefined, responseBody: body });
  }
  const data = body.data;
  if (data !== null && data !== undefined && rootsAreSet(data)) {
    return data;
  }
  throw toApiError({ status, body, operation: action });
}

export { BufferApiError };

export const bufferClient = {
  graphql: graphqlRequest,
  apiUrl: BUFFER_API_URL,
};

type GraphQLResponse<T> = {
  data?: T | null;
  errors?: unknown;
};

type GraphQLErrorEntry = {
  message: string;
  code: string | undefined;
  window: string | undefined;
};
