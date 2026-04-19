import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const MOOSEND_BASE_URL = 'https://api.moosend.com/v3';

export async function moosendRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${MOOSEND_BASE_URL}${path}?apikey=${encodeURIComponent(apiKey)}`;
  const response = await httpClient.sendRequest<T>({
    method,
    url,
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  return response.body;
}

export interface MoosendMailingList {
  ID: string;
  Name: string;
  ActiveMemberCount: number;
  UnsubscribedMemberCount: number;
  BouncedMemberCount: number;
  RemovedMemberCount: number;
  CreatedOn: string;
}

export interface MoosendSubscriber {
  Email: string;
  Name: string;
  SubscribeType: number;
  SubscribeDate: string;
  Tags: string;
  CustomFields: unknown[];
}
