import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { SignNowAuthValue, getSignNowBearerToken } from './auth';

export async function getUserId(token: string): Promise<string> {
  const response = await httpClient.sendRequest<{ id: string }>({
    method: HttpMethod.GET,
    url: 'https://api.signnow.com/user',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return response.body.id;
}

export async function registerWebhook(
  auth: SignNowAuthValue,
  event: string,
  entityId: string,
  callbackUrl: string
): Promise<string> {
  const token = getSignNowBearerToken(auth);
  const response = await httpClient.sendRequest<{ data: { id: string } }>({
    method: HttpMethod.POST,
    url: 'https://api.signnow.com/v2/event-subscriptions',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: {
      event,
      entity_id: entityId,
      attributes: {
        callback: callbackUrl,
        delete_access_token: true,
      },
    },
  });
  return response.body.data.id;
}

export async function unregisterWebhook(
  auth: SignNowAuthValue,
  subscriptionId: string
): Promise<void> {
  const token = getSignNowBearerToken(auth);
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `https://api.signnow.com/v2/event-subscriptions/${subscriptionId}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}
