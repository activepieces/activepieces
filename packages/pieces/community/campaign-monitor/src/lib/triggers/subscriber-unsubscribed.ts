import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, transformCustomFields } from '../common/client';
import { isNil } from '@activepieces/shared';
import { campaignMonitorAuth } from '../../index';
import { clientId, listId } from '../common/props';

export const subscriberUnsubscribedTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'subscriber_unsubscribed',
  displayName: 'Subscriber Unsubscribed',
  description: 'Triggered when a subscriber unsubscribes from a list',
  props: {
    clientId: clientId,
    listId: listId,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    EmailAddress: 'subscriber@example.com',
    Name: 'Former Subscriber',
    Date: '2023-07-15T15:30:00Z',
    ListID: 'xyz',
    State: 'Unsubscribed',
  },
  async onEnable(context) {
    const { listId } = context.propsValue;

    const response = await makeRequest(
      { apiKey: context.auth as string },
      HttpMethod.POST,
      `/lists/${listId}/webhooks.json`,
      {
        Events: ['Deactivate'],
        Url: context.webhookUrl,
        ListID: listId,
        PayloadFormat: 'json',
      }
    );
    const webhook = response.body as string;

    await context.store.put('subscriber_unsubscribed_webhook', webhook);
  },
  async onDisable(context) {
    const storedData = await context.store.get<string>(
      'subscriber_unsubscribed_webhook'
    );

    if (!isNil(storedData)) {
      await makeRequest(
        { apiKey: context.auth as string },
        HttpMethod.DELETE,
        `/lists/${listId}/webhooks/${storedData}.json`
      );
    }
  },
  async run(context) {
    const payload = context.payload.body as {
      ListID: string;
      Events: { Type: string; EmailAddress: string,State:string }[];
    };

    if (payload.ListID !== context.propsValue.listId) {
      return [];
    }

    const result = [];

    for (const event of payload.Events) {
      if (event.Type === 'Deactivate' && event.State==='Unsubscribed') {
        const response = await makeRequest(
          { apiKey: context.auth as string },
          HttpMethod.GET,
          `/subscribers/${context.propsValue.listId}.json?email=${encodeURIComponent(
            event.EmailAddress
          )}`,
          payload
        );
        result.push({
          ...response.body,
          CustomFields: transformCustomFields(response.body['CustomFields']),
        });
      }
    }

    return result;
  },
});
