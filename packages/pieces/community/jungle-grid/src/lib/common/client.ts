import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export class JungleGridApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor({ status, code, message }: JungleGridApiErrorParams) {
    super(`${code}: ${message}`);
    this.name = 'JungleGridApiError';
    this.status = status;
    this.code = code;
  }
}

export const jungleGridClient = { apiCall, normalizeBaseUrl };

async function apiCall({
  auth,
  method,
  path,
  body,
  queryParams,
}: JungleGridApiCallParams): Promise<unknown> {
  const { api_base_url, api_key } = getAuthProps(auth);
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${normalizeBaseUrl(api_base_url)}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: api_key,
      },
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw toJungleGridApiError(error);
    }
    throw error;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function toJungleGridApiError(error: HttpError): JungleGridApiError {
  const { status, body } = error.response;
  const parsed = parseApiError(body);
  return new JungleGridApiError({
    status,
    code: parsed.code ?? statusCodeToErrorCode(status),
    message: parsed.message ?? statusCodeToMessage(status),
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

function optionalString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const value = obj[key];
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
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'UPSTREAM_ERROR';
  return 'API_ERROR';
}

function statusCodeToMessage(status: number): string {
  if (status === 401)
    return 'Jungle Grid authentication failed. Check the API key on the connection.';
  if (status === 403)
    return 'The Jungle Grid API key is missing the required scope for this action.';
  if (status === 404)
    return 'The requested Jungle Grid resource was not found.';
  if (status === 409)
    return 'Jungle Grid could not complete the request because the resource is in a conflicting state.';
  if (status === 429)
    return 'Jungle Grid API rate limit exceeded. Try again later.';
  if (status >= 500) return 'Jungle Grid API is temporarily unavailable.';
  return `Jungle Grid API request failed with status ${status}.`;
}

function getAuthProps(auth: JungleGridAuthValue): JungleGridAuthProps {
  if ('props' in auth) {
    return auth.props;
  }
  return auth;
}

type JungleGridAuthValue =
  | { api_base_url: string; api_key: string }
  | { props: { api_base_url: string; api_key: string } };

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

type ParsedApiError = {
  code?: string;
  message?: string;
};

type JungleGridApiErrorParams = {
  status: number;
  code: string;
  message: string;
};
