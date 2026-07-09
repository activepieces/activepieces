import { Readable } from 'stream';
import { BaseHttpClient } from './base-http-client';
import { DelegatingAuthenticationConverter } from './delegating-authentication-converter';
import { HttpError } from './http-error';
import { HttpHeaders } from './http-headers';
import { HttpMessageBody } from './http-message-body';
import { HttpRequest } from './http-request';
import { HttpRequestBody } from './http-request-body';
import { HttpResponse } from './http-response';

// Native-fetch implementation of HttpClient. SSRF egress is enforced by the engine's
// in-process dns.lookup / Socket.connect guards (see ssrf-guard.ts) when
// AP_NETWORK_MODE=STRICT, which cover fetch via net.connect — so there is no egress
// proxy wiring here. A caller may still pass options.dispatcher for a user-configured
// per-request proxy (the HTTP piece's "Use Proxy" feature).
export class FetchHttpClient extends BaseHttpClient {
  constructor(
    baseUrl = '',
    authenticationConverter: DelegatingAuthenticationConverter = new DelegatingAuthenticationConverter()
  ) {
    super(baseUrl, authenticationConverter);
  }

  async sendRequest<ResponseBody extends HttpMessageBody = any>(
    request: HttpRequest<HttpRequestBody>,
    options?: SendRequestOptions
  ): Promise<HttpResponse<ResponseBody>> {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    const { urlWithoutQueryParams, queryParams: urlQueryParams } = this.getUrl(request);
    const headers = this.getHeaders(request);
    const queryParams = request.queryParams ?? {};
    for (const [key, value] of Object.entries(queryParams)) {
      urlQueryParams.append(key, value);
    }
    const queryString = urlQueryParams.toString();
    const finalUrl = queryString ? `${urlWithoutQueryParams}?${queryString}` : urlWithoutQueryParams;

    const responseType = request.responseType ?? 'json';
    const followRedirects = request.followRedirects ?? true;
    const retries = request.retries ?? 0;

    const { body, extraHeaders, isStream } = serializeBody(request.body, headers);
    const finalHeaders = normalizeHeaders({ ...headers, ...extraHeaders });

    const response = await sendWithRetries(async () => {
      const controller = new AbortController();
      const timeoutId = request.timeout && request.timeout > 0
        ? setTimeout(() => controller.abort(), request.timeout)
        : undefined;
      try {
        const init: FetchInit = {
          method: request.method.toString(),
          headers: finalHeaders,
          body,
          redirect: followRedirects ? 'follow' : 'manual',
          signal: controller.signal,
        };
        if (isStream) {
          init.duplex = 'half';
        }
        // A caller-supplied undici Dispatcher (e.g. a ProxyAgent) for per-request proxying.
        if (options?.dispatcher !== undefined) {
          init.dispatcher = options.dispatcher;
        }
        return await fetch(finalUrl, init);
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    }, retries);

    const successCeiling = followRedirects ? 300 : 400;
    if (response.status < 200 || response.status >= successCeiling) {
      // An error body is small and useful as text — never surface it as a stream.
      const errorBody = await parseResponseBody(response, responseType === 'stream' ? 'text' : responseType);
      const httpError = new HttpError(request.body, { status: response.status, responseBody: errorBody });
      console.error('[HttpClient#(sanitized error message)] Request failed:', httpError);
      throw httpError;
    }

    const responseBody = await parseResponseBody(response, responseType);
    return {
      status: response.status,
      headers: toHttpHeaders(response.headers),
      body: responseBody as ResponseBody,
    };
  }
}

function serializeBody(
  body: HttpRequestBody | undefined,
  headers: HttpHeaders
): { body: BodyInit | undefined; extraHeaders: Record<string, string>; isStream: boolean } {
  if (isNil(body)) {
    return { body: undefined, extraHeaders: {}, isStream: false };
  }
  // node `form-data` instance: a Readable stream that owns its multipart boundary.
  if (isNodeFormData(body)) {
    return { body: body as unknown as BodyInit, extraHeaders: body.getHeaders(), isStream: true };
  }
  // Already a wire-ready body — pass through untouched.
  if (
    typeof body === 'string' ||
    Buffer.isBuffer(body) ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof Blob !== 'undefined' && body instanceof Blob)
  ) {
    return { body: body as BodyInit, extraHeaders: {}, isStream: false };
  }
  const contentType = headers['Content-Type'] ?? headers['content-type'] ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { body: new URLSearchParams(body as Record<string, string>).toString(), extraHeaders: {}, isStream: false };
  }
  return { body: JSON.stringify(body), extraHeaders: {}, isStream: false };
}

async function parseResponseBody(response: Response, responseType: ResponseType): Promise<unknown> {
  switch (responseType) {
    case 'arraybuffer':
      return Buffer.from(await response.arrayBuffer());
    case 'stream':
      return toReadable(response);
    case 'blob':
      return await response.blob();
    case 'text':
      return await response.text();
    case 'json':
    default: {
      const text = await response.text();
      if (text.length === 0) {
        return undefined;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  }
}

async function sendWithRetries(fn: () => Promise<Response>, retries: number): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fn();
      if (response.status >= 500 && attempt < retries) {
        await backoff(attempt);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function backoff(attempt: number): Promise<void> {
  const delayMs = Math.min(1000 * 2 ** attempt, 30000);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function normalizeHeaders(headers: HttpHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    result[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  return result;
}

function toHttpHeaders(headers: Headers): HttpHeaders {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function toReadable(response: Response): Readable {
  const body = response.body;
  if (body === null) {
    return Readable.from([]);
  }
  return Readable.from((async function* () {
    const reader = body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          return;
        }
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  })());
}

function isNodeFormData(body: unknown): body is NodeFormData {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as NodeFormData).getHeaders === 'function' &&
    typeof (body as NodeFormData).pipe === 'function'
  );
}

function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

type NodeFormData = {
  getHeaders: () => Record<string, string>;
  pipe: (...args: unknown[]) => unknown;
};

type ResponseType = NonNullable<HttpRequest['responseType']>;

type FetchInit = RequestInit & { duplex?: 'half', dispatcher?: unknown };

export type SendRequestOptions = {
  dispatcher?: unknown;
};

export { FetchHttpClient as AxiosHttpClient };
