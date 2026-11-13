import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  CampaignMonitorWebhookEvent,
  fetchSubscriberOrEventData,
  makeRequest,
} from '../common/client';
import { isNil } from '@activepieces/pieces-framework';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { subscriberOutputSchema } from '../output-schemas';

export const newSubscriberAddedTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'new_subscriber_added',
  classification: 'READ',
  displayName: 'New Subscriber Added',
  description: 'Triggered when a new subscriber is added to a list.',
  aiMetadata: {
    description:
      'Fires when a contact subscribes to the specified Campaign Monitor list under a client, via a Subscribe webhook event, and reports the new subscriber together with their details and custom fields.',
  },
  props: {
    clientId: clientId,
    listId: listId,
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: subscriberOutputSchema,
  sampleData: {
    EmailAddress: 'subscriber@example.com',
    Name: 'New Subscriber',
    Date: '2023-07-15 15:30:00',
    ListJoinedDate: '2023-07-15 15:30:00',
    State: 'Active',
    CustomFields: {
      website: 'https://example.com',
    },
    ReadsEmailWith: '',
    ConsentToTrack: 'Yes',
    ConsentToSendSms: 'Unchanged',
    MobileNumber: '',
  },
  async onEnable(context) {
    const { listId } = context.propsValue;

    const response = await makeRequest<string>({
      auth: { apiKey: context.auth.secret_text },
      method: HttpMethod.POST,
      path: `/lists/${listId}/webhooks.json`,
      body: {
        Events: ['Subscribe'],
        Url: context.webhookUrl,
        PayloadFormat: 'json',
      },
    });

    const webhook = response.body;

    await context.store.put('new_subscriber_added_webhook', webhook);
  },
  async onDisable(context) {
    const { listId } = context.propsValue;
    const storedData = await context.store.get<string>(
      'new_subscriber_added_webhook'
    );

    if (!isNil(storedData)) {
      await makeRequest({
        auth: { apiKey: context.auth.secret_text },
        method: HttpMethod.DELETE,
        path: `/lists/${listId}/webhooks/${storedData}.json`,
      });
    }
  },
  async run(context) {
    const payload = context.payload.body as {
      ListID: string;
      Events: CampaignMonitorWebhookEvent[];
    };

    if (payload.ListID !== context.propsValue.listId) {
      return [];
    }

    const result = [];

    for (const event of payload.Events) {
      if (event.Type === 'Subscribe') {
        result.push(
          await fetchSubscriberOrEventData({
            apiKey: context.auth.secret_text,
            listId: context.propsValue.listId,
            event,
          })
        );
      }
    }

    return result;
  },
});
