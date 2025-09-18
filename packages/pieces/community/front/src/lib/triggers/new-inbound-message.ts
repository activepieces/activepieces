import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxDropdown } from '../common/props';

interface WebhookInformation {
    webhookId: string;
}

export const newInboundMessage = createTrigger({
    auth: frontAuth,
    name: 'new_inbound_message',
    displayName: 'New Inbound Message',
    description: 'Fires when a new message is received in a shared inbox.',
    props: {
        inbox_id: inboxDropdown,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "_links": {
            "self": "https://api2.frontapp.com/events/evt_123abc"
        },
        "id": "evt_123abc",
        "type": "inbound_message",
        "status": "delivered",
        "target": {
            "_links": {
                "related": {
                    "conversation": "https://api2.frontapp.com/conversations/cnv_123abc",
                    "message": "https://api2.frontapp.com/messages/msg_123abc"
                }
            },
            "data": {
                "id": "msg_123abc",
                "type": "email",
                "is_inbound": true,
                "draft_mode": null,
                "error_type": null,
                "version": "1.0",
                "body": "Hello! I'd like to place an order.",
                "text": "Hello! I'd like to place an order.",
                "attachments": [],
                "author": {
                    "id": "tea_123abc",
                    "email": "customer@example.com",
                    "first_name": "John",
                    "last_name": "Customer"
                },
                "recipients": [
                    {
                        "handle": "support@yourcompany.com",
                        "role": "to"
                    }
                ],
                "created_at": 1678886400.0
            }
        },
        "conversation": {
            "id": "cnv_123abc",
            "subject": "New Order Inquiry",
            "status": "unassigned",
            "assignee": null,
            "inbox_id": "inb_12345"
        },
        "source": { "_links": {}, "data": {} },
        "made_at": 1678886400.123
    },

    // Called when the trigger is enabled.
    async onEnable(context) {
        const response = await makeRequest<{ id: string }>(
            context.auth.toString(),
            HttpMethod.POST,
            '/events',
            {
                target_url: context.webhookUrl,
                event_types: ['inbound_message'], // Subscribe to inbound message events
            }
        );

        await context.store.put<WebhookInformation>('_new_inbound_message_trigger', {
            webhookId: response.id,
        });
    },

    // Called when the trigger is disabled.
    async onDisable(context) {
        const webhook = await context.store.get<WebhookInformation>(
            '_new_inbound_message_trigger'
        );
        if (webhook?.webhookId) {
            await makeRequest(
                context.auth.toString(),
                HttpMethod.DELETE,
                `/events/${webhook.webhookId}`
            );
        }
    },

    // Called when a webhook event is received.
    async run(context) {
        const payload = context.payload.body as {
            target: { data: Record<string, unknown> };
            conversation: { id: string; inbox_id: string };
        };

        const inboxFilter = context.propsValue.inbox_id;

        // If an inbox is selected, only return messages from that inbox.
        if (inboxFilter && payload.conversation.inbox_id !== inboxFilter) {
            return [];
        }

        return [payload.target.data];
    },
});