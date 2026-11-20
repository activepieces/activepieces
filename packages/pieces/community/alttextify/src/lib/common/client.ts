import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import mime from 'mime-types';

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }),
  );
  return verifiedTlsAgent;
}

async function request<T>({
  apiKey,
  method,
  path,
  body,
  query,
  operation,
}: RequestParams): Promise<T> {
  const dispatcher = await verifiedTlsDispatcher();
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${ALTTEXTIFY_BASE_URL}${path}`,
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      body,
      queryParams: query,
    }, { dispatcher });
    return response.body;
  } catch (error) {
    throw mapError({ error, method, operation });
  }
}

function mapError({
  error,
  method,
  operation,
}: {
  error: unknown;
  method: HttpMethod;
  operation: string;
}): AlttextifyError {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const vendorBody = error.response.body;
    const vendorMessage = readVendorMessage(vendorBody);
    const message =
      status >= 500
        ? `AltTextify failed to process the request (HTTP ${status}). Try again or use another image; no alt text was generated.`
        : `AltTextify ${operation} failed (HTTP ${status}): ${describeStatus({ status, vendorMessage })}`;
    return new AlttextifyError({ message, responseBody: vendorBody, httpStatus: status });
  }
  const detail = error instanceof Error ? error.message : String(error);
  const chargeWarning =
    method === HttpMethod.POST
      ? ' The request may still have been processed and charged a credit; check your AltTextify images before retrying.'
      : '';
  return new AlttextifyError({
    message: `AltTextify ${operation} failed: the request did not complete (${detail}).${chargeWarning}`,
    responseBody: undefined,
    httpStatus: undefined,
  });
}

function describeStatus({
  status,
  vendorMessage,
}: {
  status: number;
  vendorMessage: string | undefined;
}): string {
  const fallback = STATUS_HINTS[status] ?? 'Unexpected error from AltTextify.';
  return vendorMessage ? vendorMessage : fallback;
}

function readVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim().length > 0) {
    return body.trim();
  }
  if (body !== null && typeof body === 'object') {
    const nested = 'error' in body ? body.error : undefined;
    if (nested !== null && typeof nested === 'object') {
      const nestedMessage = readVendorMessage(nested);
      if (nestedMessage) return nestedMessage;
    }
    const code = 'code' in body ? body.code : 'error' in body ? body.error : undefined;
    const message = 'message' in body ? body.message : undefined;
    if (typeof message === 'string' && message.length > 0) {
      return typeof code === 'string' && code.length > 0
        ? `${message} (${code})`
        : message;
    }
    if (typeof code === 'string' && code.length > 0) {
      return code;
    }
  }
  return undefined;
}

function toDataUri(file: unknown): string {
  if (file === null || typeof file !== 'object') {
    throw new Error('Image File is not a valid file.');
  }
  const base64 = 'base64' in file ? file.base64 : undefined;
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error('Image File is empty or could not be read.');
  }
  const extension = 'extension' in file ? file.extension : undefined;
  const filename = 'filename' in file ? file.filename : undefined;
  const lookupKey =
    typeof extension === 'string' && extension.length > 0
      ? extension
      : typeof filename === 'string'
        ? filename
        : '';
  const detected = lookupKey ? mime.lookup(lookupKey) : false;
  const mimeType =
    typeof detected === 'string' && detected.startsWith('image/')
      ? detected
      : 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

function normalizeImage(image: AlttextifyImage): NormalizedImage {
  const altTexts = Array.isArray(image.alt_text)
    ? image.alt_text.filter((text) => typeof text === 'string')
    : typeof image.alt_text === 'string' && image.alt_text.length > 0
      ? [image.alt_text]
      : [];
  return {
    asset_id: image.asset_id,
    alt_text: altTexts.join('\n'),
    alt_texts: altTexts,
    image_source: image.image_source ?? null,
    tag: image.tag ?? null,
    created_at: image.created_at ?? null,
    status: typeof image.status === 'string' ? image.status : null,
  };
}

class AlttextifyError extends Error {
  readonly responseBody: unknown;
  readonly httpStatus: number | undefined;
  constructor({
    message,
    responseBody,
    httpStatus,
  }: {
    message: string;
    responseBody: unknown;
    httpStatus: number | undefined;
  }) {
    super(message);
    this.name = 'AlttextifyError';
    this.responseBody = responseBody;
    this.httpStatus = httpStatus;
  }
}

const STATUS_HINTS: Record<number, string> = {
  401: 'The API key is missing or invalid. Check the key in your AltTextify connection.',
  404: 'The image or job was not found.',
  413: 'The image is too large. AltTextify accepts images up to 15 MB.',
  415: 'Unsupported image type. Use JPEG, PNG, GIF, WEBP or BMP.',
  422: 'Invalid language code. Use an ISO 639-1 code such as en or fr.',
  500: 'AltTextify had an internal error. Try again later.',
};

export const ALTTEXTIFY_BASE_URL = 'https://api.alttextify.net/api/v1';

export const alttextifyApi = {
  request,
};

export { AlttextifyError, verifiedTlsDispatcher, toDataUri, normalizeImage, readVendorMessage };

export type RequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  body?: Record<string, unknown>;
  query?: QueryParams;
};

export type AlttextifyImage = {
  asset_id: string;
  alt_text?: string | string[];
  image_source?: string;
  tag?: string;
  created_at?: string;
  status?: string;
};

export type NormalizedImage = {
  asset_id: string;
  alt_text: string;
  alt_texts: string[];
  image_source: string | null;
  tag: string | null;
  created_at: string | null;
  status: string | null;
};
