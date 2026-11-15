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

export const subscriberUnsubscribedTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'subscriber_unsubscribed',
  classification: 'READ',
  displayName: 'Subscriber Unsubscribed',
  description: 'Triggered when a subscriber unsubscribes from a list',
  aiMetadata: {
    description:
      'Fires when a contact unsubscribes from the specified Campaign Monitor list under a client, via a Deactivate webhook event with an Unsubscribed state, and reports the affected subscriber and their details.',
  },
  props: {
    clientId: clientId,
    listId: listId,
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: subscriberOutputSchema,
  sampleData: {
    EmailAddress: 'subscriber@example.com',
    Name: 'Former Subscriber',
    Date: '2023-07-15 15:30:00',
    ListJoinedDate: '2023-07-01 10:00:00',
    State: 'Unsubscribed',
    CustomFields: {
      website: 'https://example.com',
    },
    ReadsEmailWith: 'Gmail',
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
        Events: ['Deactivate'],
        Url: context.webhookUrl,
        PayloadFormat: 'json',
      },
    });
    const webhook = response.body;

    await context.store.put('subscriber_unsubscribed_webhook', webhook);
  },
  async onDisable(context) {
    const { listId } = context.propsValue;
    const storedData = await context.store.get<string>(
      'subscriber_unsubscribed_webhook'
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
      if (event.Type === 'Deactivate' && event.State === 'Unsubscribed') {
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
