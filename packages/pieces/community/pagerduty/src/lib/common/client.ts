import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const PAGERDUTY_API_BASE_URL = 'https://api.pagerduty.com';
export const PAGERDUTY_ACCEPT_HEADER =
  'application/vnd.pagerduty+json;version=2';

function buildPagerDutyUrl(
  path: string,
  query?: Record<string, string | string[] | undefined>
) {
  const url = new URL(`${PAGERDUTY_API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, item);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export function pagerDutyHeaders(apiKey: string, fromEmail?: string) {
  const headers: Record<string, string> = {
    Authorization: `Token token=${apiKey}`,
    Accept: PAGERDUTY_ACCEPT_HEADER,
    'Content-Type': 'application/json',
  };

  if (fromEmail) {
    headers['From'] = fromEmail;
  }

  return headers;
}

export async function pagerDutyApiCall<T = unknown>(params: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  fromEmail?: string;
}) {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: buildPagerDutyUrl(params.path, params.query),
    headers: pagerDutyHeaders(params.apiKey, params.fromEmail),
    body: params.body,
  });

  return response.body;
}
