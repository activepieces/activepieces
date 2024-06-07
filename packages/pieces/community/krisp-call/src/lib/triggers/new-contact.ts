import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { krispcallAuth } from '../..';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const newContact = createTrigger({
  name: 'newContact',
  displayName: 'New Contact',
  auth: krispcallAuth,
  description: 'It triggers when new contact is created on krispcall.',
  props: {},
  sampleData: {
    id: '1',
    email: 'john@example.com',
    company: 'KrispCall',
    address: 'Singapore',
    name: 'John Smith',
    contact_number: '+9779834509123',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/subscribe',
      body: {
        hookUrl: context.webhookUrl,
        action: 'new_contact',
      },
      headers: {
        'X-API-KEY': context.auth.apiKey,
      },
    };
    const response = await httpClient.sendRequest(request);
    const id: string = response.body.id;
    const key = `new_contact`;
    await context.store.put(key, id);

    // implement webhook creation logic
  },
  async onDisable(context) {
    //implement webhook deletion logic
    const webhook_id = await context.store.get<string>(`new_contact`);
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/unsubscribe',
      body: {
        hookUrl: webhook_id,
      },
      headers: {
        'X-API-KEY': context.auth.apiKey,
      },
    };
    await httpClient.sendRequest(request);
  },
  async run(context) {
    return [context.payload.body];
  },
});
