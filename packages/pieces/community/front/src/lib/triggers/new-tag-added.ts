import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { tagDropdown } from '../common/props';

interface WebhookInformation {
    webhookId: string;
}

export const newTagAdded = createTrigger({
    auth: frontAuth,
    name: 'new_tag_added',
    displayName: 'New Tag Added to Conversation',
    description: 'Fires when a tag is applied to a conversation.',
    props: {
        tag_id: tagDropdown,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "_links": {
            "self": "https://api2.frontapp.com/events/evt_123def"
        },
        "id": "evt_123def",
        "type": "conversation_tagged",
        "status": "delivered",
        "target": {
            "_links": {
                "related": {
                    "conversation": "https://api2.frontapp.com/conversations/cnv_123def"
                }
            },
            "data": {
                "id": "tag_123def",
                "name": "Priority",
                "highlight": "red",
                "is_private": false
            }
        },
        "conversation": {
            "id": "cnv_123def",
            "subject": "Urgent: Order #XYZ-123",
            "status": "unassigned",
            "assignee": null,
            "inbox_id": "inb_12345"
        },
        "source": { "_links": {}, "data": {} },
        "made_at": 1678886400.123
    },

    async onEnable(context) {
        const response = await makeRequest<{ id: string }>(
            context.auth.toString(),
            HttpMethod.POST,
            '/events',
            {
                target_url: context.webhookUrl,
                event_types: ['conversation_tagged'], 
            }
        );

        await context.store.put<WebhookInformation>('_new_tag_added_trigger', {
            webhookId: response.id,
        });
    },

    async onDisable(context) {
        const webhook = await context.store.get<WebhookInformation>(
            '_new_tag_added_trigger'
        );
        if (webhook?.webhookId) {
            await makeRequest(
                context.auth.toString(),
                HttpMethod.DELETE,
                `/events/${webhook.webhookId}`
            );
        }
    },

    async run(context) {
        const payload = context.payload.body as {
            target: { data: { id: string, name: string } };
            conversation: { id: string; subject: string; inbox_id: string };
        };

        const tagFilter = context.propsValue.tag_id;


        if (tagFilter && payload.target.data.id !== tagFilter) {
            return [];
        }

        return [{
            tag: payload.target.data,
            conversation: payload.conversation
        }];
    },
});