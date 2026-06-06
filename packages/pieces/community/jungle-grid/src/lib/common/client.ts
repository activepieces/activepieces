import { HttpMethod } from '@activepieces/pieces-common';

async function apiCall({
  auth,
  method,
  path,
  body,
  queryParams,
}: JungleGridApiCallParams): Promise<unknown> {
  const authProps = getAuthProps(auth);
  const sensitiveValues = collectSensitiveValues({ auth, body });
  const response = await fetch(
    buildUrl({
      baseUrl: authProps.api_base_url,
      path,
      queryParams,
    }),
    {
      method,
      headers: buildHeaders({ auth: authProps, hasBody: body !== undefined }),
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

  const responseBody = await readResponseBody({
    response,
    sensitiveValues,
  });

  if (!response.ok) {
    throw toJungleGridApiError({
      status: response.status,
      body: responseBody,
      sensitiveValues,
    });
  }

  return responseBody;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildUrl({
  baseUrl,
  path,
  queryParams,
}: BuildUrlParams): string {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${path}`);
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function buildHeaders({
  auth,
  hasBody,
}: BuildHeadersParams): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${auth.api_key}`,
  };

  if (hasBody) {
    return {
      ...headers,
      'Content-Type': 'application/json',
    };
  }

  return headers;
}

async function readResponseBody({
  response,
  sensitiveValues,
}: ReadResponseBodyParams): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    if (response.ok) {
      throw new JungleGridApiError({
        status: response.status,
        code: 'INVALID_API_RESPONSE',
        message: 'Jungle Grid API returned an invalid JSON response.',
      });
    }

    return {
      message: redactSensitiveText({
        text: 'Jungle Grid API returned a non-JSON error response.',
        sensitiveValues,
      }),
    };
  }
}

function toJungleGridApiError({
  status,
  body,
  sensitiveValues,
}: ToJungleGridApiErrorParams): JungleGridApiError {
  const parsed = parseApiError(body);
  return new JungleGridApiError({
    status,
    code: redactSensitiveText({
      text: parsed.code ?? statusCodeToErrorCode(status),
      sensitiveValues,
    }),
    message: redactSensitiveText({
      text: parsed.message ?? statusCodeToMessage(status),
      sensitiveValues,
    }),
  });
}

function parseApiError(body: unknown): ParsedApiError {
  if (!isRecord(body)) {
    return {};
  }

  const nestedError = body['error'];
  if (isRecord(nestedError)) {
    return {
      code: optionalString(nestedError, 'code'),
      message:
        optionalString(nestedError, 'message') ??
        optionalString(nestedError, 'detail'),
    };
  }

  return {
    code: optionalString(body, 'code'),
    message:
      optionalString(body, 'message') ??
      optionalString(body, 'detail') ??
      optionalString(body, 'error'),
  };
}

function collectSensitiveValues({
  auth,
  body,
}: CollectSensitiveValuesParams): string[] {
  const authProps = getAuthProps(auth);
  const values = [
    authProps.api_key,
    ...collectSensitiveFieldValues(body, ''),
  ];

  return values.filter((value, index) => {
    const trimmed = value.trim();
    return trimmed.length > 0 && values.findIndex((item) => item.trim() === trimmed) === index;
  });
}

function collectSensitiveFieldValues(value: unknown, key: string): string[] {
  if (typeof value === 'string') {
    return isSensitiveKey(key) ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSensitiveFieldValues(item, key));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([entryKey, entryValue]) =>
      collectSensitiveFieldValues(entryValue, entryKey),
    );
  }

  return [];
}

function redactSensitiveText({
  text,
  sensitiveValues,
}: RedactSensitiveTextParams): string {
  const redactedKnownPatterns = text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/jg_[A-Za-z0-9._-]+/g, '[redacted]');

  return sensitiveValues.reduce((result, sensitiveValue) => {
    const trimmed = sensitiveValue.trim();
    if (trimmed.length < 4) {
      return result;
    }

    return result.replace(new RegExp(escapeRegExp(trimmed), 'g'), '[redacted]');
  }, redactedKnownPatterns);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSensitiveKey(key: string): boolean {
  return /api[_-]?key|token|secret|password|authorization/i.test(key);
}

function getAuthProps(auth: JungleGridAuthValue): JungleGridAuthProps {
  if ('props' in auth) {
    return auth.props;
  }

  return auth;
}

function optionalString(propsValue: Record<string, unknown>, key: string): string | undefined {
  const value = propsValue[key];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function statusCodeToErrorCode(status: number): string {
  if (status === 401) {
    return 'UNAUTHORIZED';
  }
  if (status === 403) {
    return 'FORBIDDEN';
  }
  if (status === 404) {
    return 'NOT_FOUND';
  }
  if (status === 409) {
    return 'CONFLICT';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status >= 500) {
    return 'UPSTREAM_ERROR';
  }
  return 'API_ERROR';
}

function statusCodeToMessage(status: number): string {
  if (status === 401) {
    return 'Jungle Grid authentication failed. Check the API key on the connection.';
  }
  if (status === 403) {
    return 'The Jungle Grid API key is missing the required scope for this action.';
  }
  if (status === 404) {
    return 'The requested Jungle Grid resource was not found.';
  }
  if (status === 409) {
    return 'Jungle Grid could not complete the request because the resource is in a conflicting state.';
  }
  if (status === 429) {
    return 'Jungle Grid API rate limit exceeded. Try again later.';
  }
  if (status >= 500) {
    return 'Jungle Grid API is temporarily unavailable.';
  }
  return `Jungle Grid API request failed with status ${status}.`;
}

export const jungleGridClient = {
  apiCall,
  normalizeBaseUrl,
};

export class JungleGridApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor({
    status,
    code,
    message,
  }: JungleGridApiErrorParams) {
    super(`${code}: ${message}`);
    this.name = 'JungleGridApiError';
    this.status = status;
    this.code = code;
  }
}

type JungleGridAuthValue = {
  api_base_url: string;
  api_key: string;
} | {
  props: {
    api_base_url: string;
    api_key: string;
  };
};

type JungleGridAuthProps = {
  api_base_url: string;
  api_key: string;
};

type JungleGridApiCallParams = {
  auth: JungleGridAuthValue;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
};

type BuildUrlParams = {
  baseUrl: string;
  path: string;
  queryParams?: Record<string, string>;
};

type BuildHeadersParams = {
  auth: JungleGridAuthProps;
  hasBody: boolean;
};

type ReadResponseBodyParams = {
  response: Response;
  sensitiveValues: string[];
};

type ToJungleGridApiErrorParams = {
  status: number;
  body: unknown;
  sensitiveValues: string[];
};

type ParsedApiError = {
  code?: string;
  message?: string;
};

type CollectSensitiveValuesParams = {
  auth: JungleGridAuthValue;
  body?: Record<string, unknown>;
};

type RedactSensitiveTextParams = {
  text: string;
  sensitiveValues: string[];
};

type JungleGridApiErrorParams = {
  status: number;
  code: string;
  message: string;
};
