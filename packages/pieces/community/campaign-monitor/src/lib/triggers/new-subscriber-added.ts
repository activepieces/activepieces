import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, transformCustomFields } from '../common/client';
import { isNil } from '@activepieces/shared';
import { campaignMonitorAuth } from '../../index';
import { clientId, listId } from '../common/props';

export const newSubscriberAddedTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'new_subscriber_added',
  displayName: 'New Subscriber Added',
  description: 'Triggered when a new subscriber is added to a list.',
  props: {
    clientId: clientId,
    listId: listId,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    EmailAddress: 'subscriber@example.com',
    Name: 'New Subscriber',
    Date: '2023-07-15T15:30:00Z',
    ListID: 'xyz',
    CustomFields: {
      website: 'https://example.com',
    },
    State: 'Active',
    ConsentToTrack: 'Yes',
  },
  async onEnable(context) {
    const { listId } = context.propsValue;

    const response = await makeRequest(
      { apiKey: context.auth as string },
      HttpMethod.POST,
      `/lists/${listId}/webhooks.json`,
      {
        Events: ['Subscribe'],
        Url: context.webhookUrl,
        PayloadFormat: 'json',
      }
    );

    const webhook = response.body as string;

    await context.store.put('new_subscriber_added_webhook', webhook);
  },
  async onDisable(context) {
    const { listId } = context.propsValue;
    const storedData = await context.store.get<string>(
      'new_subscriber_added_webhook'
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
      Events: { Type: string; EmailAddress: string }[];
    };

    if (payload.ListID !== context.propsValue.listId) {
      return [];
    }

    const result = [];

    for (const event of payload.Events) {
      if (event.Type === 'Subscribe') {
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
