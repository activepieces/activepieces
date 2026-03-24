import {
  HttpMethod,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';

export const AMPLITUDE_BASE_URL = 'https://api2.amplitude.com';

export async function amplitudeTrackEvents({
  apiKey,
  events,
}: {
  apiKey: string;
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
      events,
    },
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export async function amplitudeIdentify({
  apiKey,
  identification,
}: {
  apiKey: string;
  identification: Array<{
    user_id?: string;
    device_id?: string;
    user_properties?: Record<string, unknown>;
  }>;
}) {
  const form = new URLSearchParams();
  form.set('api_key', apiKey);
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
