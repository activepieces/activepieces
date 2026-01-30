import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const enum EventTrigger {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
}

export const CAL_API_BASE_URL = 'https://api.cal.com/v2';
export const CAL_API_VERSION = '2024-09-04';

export async function calComApiCall<T>(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${CAL_API_BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}
