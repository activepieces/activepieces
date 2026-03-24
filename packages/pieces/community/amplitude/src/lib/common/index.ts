import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';

export const AMPLITUDE_BASE_URL = 'https://api2.amplitude.com';

export async function amplitudeTrackEvents({
  apiKey,
  secretKey,
  events,
}: {
  apiKey: string;
  secretKey: string;
  events: Array<{
    event_type: string;
    user_id?: string;
    device_id?: string;
    event_properties?: Record<string, unknown>;
  }>;
}) {
  const request: HttpRequest = {
    url: `${AMPLITUDE_BASE_URL}/2/httpapi`,
    method: HttpMethod.POST,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      api_key: apiKey,
      secret_key: secretKey,
      events,
    },
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export async function amplitudeIdentify({
  apiKey,
  secretKey,
  identification,
}: {
  apiKey: string;
  secretKey: string;
  identification: Array<{
    user_id?: string;
    device_id?: string;
    user_properties?: Record<string, unknown>;
  }>;
}) {
  const form = new URLSearchParams();
  form.set('api_key', apiKey);
  form.set('secret_key', secretKey);
  form.set('identification', JSON.stringify(identification));

  const request: HttpRequest = {
    url: `${AMPLITUDE_BASE_URL}/identify`,
    method: HttpMethod.POST,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}
