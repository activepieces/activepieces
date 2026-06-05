import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpHeaders,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.filetopdf.dev';

/**
 * Error codes that mean "the connection/plan is misconfigured" rather than "this
 * one input was bad". Mirrors the Zapier middleware + Pipedream connector so every
 * FileToPDF integration surfaces the same friendly guidance.
 */
const CONFIG_ERROR_CODES = new Set([
  'missing_api_key',
  'forbidden',
  'subscription_required',
  'payment_required',
  'upgrade_required',
]);

interface FileToPdfErrorBody {
  status?: string;
  error?: {
    code?: string;
    message?: string;
    upgrade_url?: string;
    parameter?: string;
    remaining?: number;
    concurrent_limit?: number;
  };
}

/**
 * Friendly, plain-English messages for the error codes worth special-casing.
 * Ported verbatim from the Zapier middleware so the copy stays identical across
 * integrations. Everything else falls back to the API's own message + code.
 */
export function friendlyMessage(
  code: string,
  error: NonNullable<FileToPdfErrorBody['error']>,
  status: number
): string {
  switch (code) {
    case 'upgrade_required': {
      const param = error.parameter
        ? `The "${error.parameter}" option`
        : 'That conversion option';
      return `${param} is only available on the Pro and Scale plans (and the free trial). Upgrade to use conversion options${
        error.upgrade_url ? `: ${error.upgrade_url}` : ''
      }.`;
    }
    case 'forbidden_url':
      return 'That URL points to a private or internal address, which is not allowed. Use a public http(s) link.';
    case 'payment_required':
      return `You're out of credits. Top up or upgrade${
        error.upgrade_url ? ` at ${error.upgrade_url}` : ' at https://filetopdf.dev/subscription'
      }.`;
    case 'subscription_required':
      return 'No active subscription. Activate a plan at https://filetopdf.dev/subscription to run conversions.';
    case 'concurrency_limit':
      return `Your plan allows ${
        error.concurrent_limit || 'a limited number of'
      } concurrent conversion(s). Upgrade for more, or retry in a moment.`;
    case 'file_too_large':
      return 'File too large — the maximum is 30 MB.';
    case 'missing_api_key':
    case 'forbidden':
      return 'Invalid or missing API key. Reconnect your FileToPDF account.';
    default:
      return error.message || `Request failed with status ${status}.`;
  }
}

/**
 * Turn a non-2xx FileToPDF error envelope into a clean thrown Error. The message
 * is the friendly text plus the stable error code, mirroring the Zapier/Pipedream
 * connectors. Config-type codes are flagged so callers can reword if desired.
 */
function throwFriendly(status: number, body: unknown): never {
  let envelope: FileToPdfErrorBody = {};
  if (body && typeof body === 'object') {
    envelope = body as FileToPdfErrorBody;
  } else if (typeof body === 'string') {
    try {
      envelope = JSON.parse(body) as FileToPdfErrorBody;
    } catch {
      envelope = {};
    }
  }
  const error = envelope.error || {};
  const code = error.code || 'error';
  const message = friendlyMessage(code, error, status);
  const prefix = CONFIG_ERROR_CODES.has(code) ? 'FileToPDF connection problem: ' : '';
  throw new Error(`${prefix}${message} (${code})`);
}

interface FileToPdfRequest {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: HttpMessageBody;
  /** Extra headers (e.g. multipart boundary from form-data.getHeaders()). */
  headers?: HttpHeaders;
}

/**
 * Single entry point for every FileToPDF call. Sends the API key in the
 * `x-api-key` header (the API has no bearer scheme) and asks for the JSON
 * envelope by default so conversions return base64 PDF + metadata. Any non-2xx
 * is converted to a friendly Error.
 */
export async function filetopdfApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  body,
  headers,
}: FileToPdfRequest): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${resourceUri}`,
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
        ...headers,
      },
      body,
    });
    return response.body;
  } catch (e) {
    const err = e as { response?: { status?: number; body?: unknown }; message?: string };
    if (err.response && typeof err.response.status === 'number') {
      throwFriendly(err.response.status, err.response.body);
    }
    throw new Error(err.message || 'FileToPDF request failed.');
  }
}
