import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

function normalizeBaseUrl({
  value,
  fieldName,
}: {
  value: string | undefined;
  fieldName: string;
}): string {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  if (!URL.canParse(trimmed)) {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  const parsed = new URL(trimmed);

  if (parsed.protocol !== 'https:') {
    throw new Error(`${fieldName} must use HTTPS.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not include credentials.`);
  }

  if (parsed.search || parsed.hash) {
    throw new Error(
      `${fieldName} must not include query parameters or a fragment.`,
    );
  }

  if (parsed.pathname !== '/') {
    throw new Error(
      `${fieldName} must contain only the server origin, without a path.`,
    );
  }

  return parsed.origin;
}

function requireNonEmpty({
  value,
  fieldName,
}: {
  value: string | undefined;
  fieldName: string;
}): string {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

function formUrlEncode(values: Record<string, string>): string {
  return new URLSearchParams(values).toString();
}

function encodeODataKey(value: string): string {
  const escaped = value.trim().replace(/'/g, "''");

  if (!escaped) {
    throw new Error('User ID is required.');
  }

  return encodeURIComponent(escaped);
}

function assertCustomApiRelativePath(value: string | undefined): void {
  const path = requireNonEmpty({
    value,
    fieldName: 'Custom API Call URL',
  });

  if (
    URL.canParse(path) ||
    path.startsWith('//') ||
    path.startsWith('\\') ||
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(path)
  ) {
    throw new Error(
      'Custom API Call URL must be a relative SuccessFactors OData V2 path. Absolute URLs are not allowed.',
    );
  }

  const pathOnly = path.split(/[?#]/, 1)[0];

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(pathOnly);
  } catch {
    throw new Error('Custom API Call URL contains invalid URL encoding.');
  }

  const segments = decodedPath.replace(/\\/g, '/').split('/');

  if (segments.some((segment) => segment === '..')) {
    throw new Error(
      'Custom API Call URL must not navigate outside the configured OData V2 path.',
    );
  }
}

async function apiCall<T extends HttpMessageBody>({
  apiUrl,
  accessToken,
  method,
  path,
  queryParams,
  body,
  headers,
}: {
  apiUrl: string;
  accessToken: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
  body?: HttpMessageBody;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const baseUrl = normalizeBaseUrl({
    value: apiUrl,
    fieldName: 'API URL',
  });

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${normalizedPath}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    queryParams,
    body,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
}

export const successFactorsHttp = {
  normalizeBaseUrl,
  requireNonEmpty,
  formUrlEncode,
  encodeODataKey,
  assertCustomApiRelativePath,
  apiCall,
};
