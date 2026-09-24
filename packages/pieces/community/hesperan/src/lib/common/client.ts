import {
  HttpError,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

async function post<T extends HttpMessageBody>({
  apiKey,
  path,
  body,
  headers,
}: {
  apiKey: string;
  path: string;
  body: unknown;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  try {
    return await httpClient.sendRequest<T>({
      method: HttpMethod.POST,
      url: `${HESPERAN_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (e) {
    if (e instanceof HttpError) {
      throw new Error(
        describeError({
          status: e.response.status,
          message: errorText(e.response.body),
        })
      );
    }
    throw e;
  }
}

async function get<T extends HttpMessageBody>({
  apiKey,
  path,
}: {
  apiKey: string;
  path: string;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${HESPERAN_BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    timeout: LOOKUP_TIMEOUT_MS,
  });
}

async function validateKey({
  apiKey,
}: {
  apiKey: string;
}): Promise<{ valid: true } | { valid: false; error: string }> {
  if (!apiKey.trim().startsWith('hsp_')) {
    return { valid: false, error: 'Hesperan API keys start with hsp_.' };
  }
  try {
    await get({ apiKey, path: '/v1/me' });
    return { valid: true };
  } catch (e) {
    if (e instanceof HttpError) {
      const status = e.response.status;
      if (status === 401) {
        return {
          valid: false,
          error: 'This API key is unknown or revoked. Create a new key in the Hesperan console.',
        };
      }
      return {
        valid: false,
        error: `Hesperan could not check the key (HTTP ${status}). Try again in a moment.`,
      };
    }
    return { valid: false, error: 'Hesperan could not be reached. Try again in a moment.' };
  }
}

async function listProfiles({ apiKey }: { apiKey: string }): Promise<HesperanProfile[]> {
  try {
    const response = await get<{ profiles: HesperanProfile[] }>({ apiKey, path: '/v1/profiles' });
    return Array.isArray(response.body?.profiles) ? response.body.profiles : [];
  } catch (e) {
    if (e instanceof HttpError) {
      throw new Error(
        describeError({
          status: e.response.status,
          message: errorText(e.response.body),
        })
      );
    }
    throw e;
  }
}

function describeError({ status, message }: { status: number; message: string | null }): string {
  const detail = message ? `: ${message}` : '';
  switch (status) {
    case 400:
      return `Hesperan rejected the request${detail}. Fix the input; retrying it unchanged will fail again.`;
    case 401:
      return 'The Hesperan API key is missing, unknown or revoked. Reconnect with a valid key from the console.';
    case 402:
      return `Hesperan could not bill this request${detail}. Nothing was charged. Top up your balance or subscribe to Pro in the Hesperan console (Billing), then run again.`;
    case 404:
      return `Hesperan did not find it${detail}. Check the profile slug or decision ID.`;
    case 409:
      return `Hesperan refused the request${detail}.`;
    case 413:
      return 'The request is larger than 256 KB. Send less state.';
    case 429:
      return 'Hesperan rate limit exceeded. Nothing was charged. Retry after a short wait, for example with "Retry on failure" on this step.';
    case 502:
      return 'The Hesperan model was temporarily unavailable or answered invalidly. Nothing was charged. Retry with backoff.';
    case 503:
      return message !== null && message.includes('opens soon')
        ? 'The Hesperan API is not live yet: no model is connected. Nothing was charged. Retrying will not help until the API opens.'
        : 'The Hesperan model is starting. Nothing was charged. Retry in about 30 seconds.';
    default:
      return `Hesperan returned HTTP ${status}${detail}.`;
  }
}

function errorText(body: unknown): string | null {
  if (typeof body === 'string') {
    return body.length > 0 ? body : null;
  }
  if (isRecord(body) && typeof body['error'] === 'string') {
    return body['error'];
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const HESPERAN_BASE_URL = 'https://api.hesperan.com';

export type HesperanProfile = {
  slug: string;
  name: string;
  type: 'choice' | 'noul' | 'score';
  options: string[];
  calibrated: boolean;
  calibration_status: string | null;
  calibration_version: number | null;
  target_precision: number | null;
};

export const hesperanApi = {
  post,
  get,
  validateKey,
  listProfiles,
  describeError,
  isRecord,
};

const REQUEST_TIMEOUT_MS = 200_000;
const LOOKUP_TIMEOUT_MS = 20_000;
