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

export async function chargebeeRequest<TResponse>({
  site,
  apiKey,
  method,
  path,
  body,
  contentType = 'application/json',
}: ChargebeeRequestParams): Promise<TResponse> {
  try {
    const response = await httpClient.sendRequest<TResponse>({
      method,
      url: `${getChargebeeBaseUrl(site)}${path}`,
      headers: {
        Accept: 'application/json',
        Authorization: getChargebeeAuthHeader(apiKey),
        'Content-Type': contentType,
      },
      body: body,
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
