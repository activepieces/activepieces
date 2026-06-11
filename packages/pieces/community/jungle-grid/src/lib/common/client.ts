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

async function uploadJobInput({
  auth,
  file,
  filename,
  contentType,
  kind,
}: UploadJobInputParams): Promise<unknown> {
  const resolvedFilename = filename?.trim() || file.filename?.trim();
  if (!resolvedFilename) {
    throw new Error('File name is required.');
  }

  const resolvedContentType = contentType?.trim() || fileContentType({
    file,
    filename: resolvedFilename,
  });
  const slot = await apiCall({
    auth,
    method: HttpMethod.POST,
    path: '/v1/job-inputs',
    body: removeEmptyValues({
      filename: resolvedFilename,
      content_type: resolvedContentType,
      kind: kind?.trim() || undefined,
    }),
  });
  const upload = parseUploadSlot(slot);
  const sensitiveValues = collectSensitiveValues({ auth, body: upload });

  await uploadFileBytes({
    upload,
    file,
    contentType: resolvedContentType,
    sensitiveValues,
  });

  const complete = await completeUpload({
    auth,
    completeUrl: upload.complete_url,
    inputId: upload.input_id,
  });

  return {
    ...asRecord(slot),
    input_id: upload.input_id,
    filename: upload.filename ?? resolvedFilename,
    content_type: resolvedContentType,
    kind: kind?.trim() || undefined,
    complete,
  };
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

async function uploadFileBytes({
  upload,
  file,
  contentType,
  sensitiveValues,
}: UploadFileBytesParams): Promise<void> {
  const response = await fetch(upload.upload_url, {
    method: upload.method,
    headers: removeUndefinedHeaders({
      'Content-Type': contentType,
      Authorization: upload.token ? `Bearer ${upload.token}` : undefined,
    }),
    body: fileBytes(file),
  });

  if (!response.ok) {
    const responseBody = await readResponseBody({
      response,
      sensitiveValues,
    });
    throw toJungleGridApiError({
      status: response.status,
      body: responseBody,
      sensitiveValues,
    });
  }
}

async function completeUpload({
  auth,
  completeUrl,
  inputId,
}: CompleteUploadParams): Promise<unknown> {
  const path = completeUrl.startsWith('http://') || completeUrl.startsWith('https://')
    ? `${new URL(completeUrl).pathname}${new URL(completeUrl).search}`
    : completeUrl || `/v1/job-inputs/${encodeURIComponent(inputId)}/complete`;

  return await apiCall({
    auth,
    method: HttpMethod.POST,
    path,
  });
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

function parseUploadSlot(value: unknown): UploadSlot {
  const record = asRecord(value);
  const upload = asRecord(record['upload']);
  const inputId = optionalString(upload, 'input_id');
  const uploadUrl = optionalString(upload, 'upload_url');
  if (!inputId) {
    throw new Error('Jungle Grid did not return an input_id for the upload.');
  }
  if (!uploadUrl) {
    throw new Error('Jungle Grid did not return an upload_url for the input.');
  }

  return {
    input_id: inputId,
    filename: optionalString(upload, 'filename'),
    method: optionalString(upload, 'method') ?? 'PUT',
    upload_url: uploadUrl,
    token: optionalString(upload, 'token'),
    complete_url: optionalString(upload, 'complete_url') ?? `/v1/job-inputs/${encodeURIComponent(inputId)}/complete`,
  };
}

function fileBytes(file: JungleGridFile): BodyInit {
  if (file.data instanceof Buffer) {
    return file.data;
  }
  if (file.data instanceof Uint8Array) {
    return file.data;
  }
  if (typeof file.base64 === 'string' && file.base64.length > 0) {
    return Buffer.from(file.base64, 'base64');
  }

  throw new Error('The selected file does not include readable file content.');
}

function fileContentType({
  file,
  filename,
}: FileContentTypeParams): string {
  if (typeof file.contentType === 'string' && file.contentType.trim()) {
    return file.contentType.trim();
  }
  if (typeof file.mimeType === 'string' && file.mimeType.trim()) {
    return file.mimeType.trim();
  }
  if (filename.endsWith('.json')) {
    return 'application/json';
  }
  if (filename.endsWith('.py')) {
    return 'text/x-python';
  }
  if (filename.endsWith('.txt')) {
    return 'text/plain';
  }

  return 'application/octet-stream';
}

function removeEmptyValues(value: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(value).reduce<Record<string, unknown>>((result, [key, entry]) => {
    if (entry === undefined || entry === null || entry === '') {
      return result;
    }

    return {
      ...result,
      [key]: entry,
    };
  }, {});
}

function removeUndefinedHeaders(value: Record<string, string | undefined>): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((result, [key, entry]) => {
    if (entry === undefined || entry === '') {
      return result;
    }

    return {
      ...result,
      [key]: entry,
    };
  }, {});
}

function asRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }

  return {};
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
  uploadJobInput,
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

type UploadJobInputParams = {
  auth: JungleGridAuthValue;
  file: JungleGridFile;
  filename?: string;
  contentType?: string;
  kind?: string;
};

type JungleGridFile = {
  filename?: string;
  base64?: string;
  data?: Buffer | Uint8Array;
  contentType?: string;
  mimeType?: string;
};

type UploadSlot = {
  input_id: string;
  filename?: string;
  method: string;
  upload_url: string;
  token?: string;
  complete_url: string;
};

type UploadFileBytesParams = {
  upload: UploadSlot;
  file: JungleGridFile;
  contentType: string;
  sensitiveValues: string[];
};

type CompleteUploadParams = {
  auth: JungleGridAuthValue;
  completeUrl: string;
  inputId: string;
};

type FileContentTypeParams = {
  file: JungleGridFile;
  filename: string;
};
