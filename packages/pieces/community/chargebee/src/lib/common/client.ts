import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const CHARGEBEE_API_SUFFIX = '/api/v2';

type ChargebeeErrorBody = {
  message?: string;
  api_error_code?: string;
  error_code?: string;
  type?: string;
};

type ChargebeeRequestParams = {
  site: string;
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
};

export function getChargebeeBaseUrl(site: string): string {
  return `https://${site.trim()}.chargebee.com${CHARGEBEE_API_SUFFIX}`;
}

export function getChargebeeAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

export function cleanObject(
  value: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null) {
        return false;
      }
      if (typeof entry === 'string') {
        return entry.trim().length > 0;
      }
      return true;
    })
  );
}

/**
 * Serialize a plain object to an application/x-www-form-urlencoded string.
 * Keys are passed through as-is (so bracket notation like
 * `subscription_items[item_price_id][0]` is preserved), while values are
 * percent-encoded manually with encodeURIComponent.
 */
function toFormEncoded(body: Record<string, unknown>): string {
  return Object.entries(body)
    .map(
      ([key, value]) => `${key}=${encodeURIComponent(String(value))}`
    )
    .join('&');
}

export async function chargebeeRequest<TResponse>({
  site,
  apiKey,
  method,
  path,
  body,
  contentType = 'application/x-www-form-urlencoded',
}: ChargebeeRequestParams): Promise<TResponse> {
  try {
    const isFormEncoded = contentType === 'application/x-www-form-urlencoded';
    const serializedBody =
      body && isFormEncoded ? toFormEncoded(body) : body;

    const response = await httpClient.sendRequest<TResponse>({
      method,
      url: `${getChargebeeBaseUrl(site)}${path}`,
      headers: {
        Accept: 'application/json',
        Authorization: getChargebeeAuthHeader(apiKey),
        'Content-Type': contentType,
      },
      body: serializedBody,
    });

    return response.body;
  } catch (error) {
    const chargebeeError = error as {
      response?: { body?: ChargebeeErrorBody; status?: number };
      message?: string;
    };
    const status = chargebeeError.response?.status;
    const message =
      chargebeeError.response?.body?.message ??
      chargebeeError.message ??
      'Chargebee API request failed.';

    throw new Error(
      status ? `${message} (status ${status})` : message
    );
  }
}
