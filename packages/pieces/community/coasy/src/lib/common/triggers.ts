
import { CoasyClient } from './coasyClient';

import { SecretTextProperty, ShortTextProperty, StaticPropsValue, Store } from '@activepieces/pieces-framework';

export interface CreateTriggerRequest {
  triggerName: string;
  webhookUrl: string;
  auth:  StaticPropsValue<{
    baseUrl: ShortTextProperty<true>,
    apiKey: SecretTextProperty<true>
  }>
  filter: any;
  store: Store;
}

export interface DestroyTriggerRequest {
  triggerName: string;
  auth:  StaticPropsValue<{
    baseUrl: ShortTextProperty<true>,
    apiKey: SecretTextProperty<true>
  }>
  store: Store;
}

export const createCoasyTrigger = async (request: CreateTriggerRequest) => {
  const { triggerName, webhookUrl, filter, auth, store} = request;
  const client = new CoasyClient(auth.baseUrl, auth.apiKey);
  const response = await client.createTrigger(triggerName, webhookUrl, filter);
  if (!response.id) throw new Error(`Failed to create Trigger!`);
  await store.put<string>(`${triggerName}__WEBHOOK_ID`, response.id);
};

export const destroyCoasyTrigger = async (request: DestroyTriggerRequest) =>  {
  const { triggerName, auth, store} = request;
  const webhookId = await store.get<string>(`${triggerName}__WEBHOOK_ID`);
  if (!webhookId) throw new Error(`Webhook Id not found!`);

  const client = new CoasyClient(auth.baseUrl, auth.apiKey);
  await client.destroyTrigger(webhookId);
}
