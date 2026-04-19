import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BUTTONDOWN_BASE_URL = 'https://api.buttondown.email/v1';

export async function buttondownRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BUTTONDOWN_BASE_URL}${path}`,
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export interface ButtondownSubscriber {
  id: string;
  email: string;
  creation_date: string;
  secondary_id: number;
  subscriber_type: string;
  source: string;
  tags: string[];
  utm_campaign: string;
  utm_medium: string;
  utm_source: string;
  referrer_url: string;
  metadata: Record<string, unknown>;
}

export interface ButtondownPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
