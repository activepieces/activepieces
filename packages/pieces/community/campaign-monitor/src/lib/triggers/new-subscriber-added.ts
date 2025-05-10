import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { campaignMonitorAuth } from '../../index';

export const newSubscriberAddedTrigger = createTrigger({
    auth: campaignMonitorAuth,
    name: 'new_subscriber_added',
    displayName: 'New Subscriber Added',
    description: 'Triggered when a new subscriber is added to a list',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to watch for new subscribers',
            required: true,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "EmailAddress": "subscriber@example.com",
        "Name": "New Subscriber",
        "Date": "2023-07-15T15:30:00Z",
        "ListID": "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
        "CustomFields": [
            {
                "Key": "website",
                "Value": "https://example.com"
            }
        ],
        "State": "Active",
        "ConsentToTrack": "Yes"
    },
    async onEnable(context) {
        const { listId } = context.propsValue;

        const response = await makeRequest(
            { apiKey: context.auth as string },
            HttpMethod.POST,
            '/webhooks.json',
            {
                Events: ['Subscribe'],
                Url: context.webhookUrl,
                ListID: listId,
                PayloadFormat: 'json'
            }
        ) as CreateWebhookResponse;

        await context.store.put('new_subscriber_added_webhook', {
            webhookId: response.WebhookID
        });
    },
    async onDisable(context) {
        const storedData = await context.store.get<StoredData>('new_subscriber_added_webhook');

        if (!isNil(storedData) && !isNil(storedData.webhookId)) {
            await makeRequest(
                { apiKey: context.auth as string },
                HttpMethod.DELETE,
                `/webhooks/${storedData.webhookId}.json`
            );
        }
    },
    async run(context) {
        return [context.payload.body];
    },
});

interface CreateWebhookResponse {
    WebhookID: string;
}

interface StoredData {
    webhookId: string;
}
