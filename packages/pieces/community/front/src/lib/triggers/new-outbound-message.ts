import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxDropdown, teammateDropdown } from '../common/props';

interface WebhookInformation {
    webhookId: string;
}

export const newOutboundMessage = createTrigger({
    auth: frontAuth,
    name: 'new_outbound_message',
    displayName: 'New Outbound Message',
    description: 'Fires when a message is sent or replied to in Front.',
    props: {
        inbox_id: inboxDropdown,
        teammate_id: teammateDropdown({
            displayName: "Teammate",
            description: "Only trigger for messages sent by this teammate. If blank, triggers for any teammate.",
            required: false,
        })
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "_links": {
            "self": "https://api2.frontapp.com/events/evt_123ghi"
        },
        "id": "evt_123ghi",
        "type": "outbound_message",
        "status": "delivered",
        "target": {
            "_links": {
                "related": {
                    "conversation": "https://api2.frontapp.com/conversations/cnv_123ghi",
                    "message": "https://api2.frontapp.com/messages/msg_123ghi"
                }
            },
            "data": {
                "id": "msg_123ghi",
                "type": "email",
                "is_inbound": false,
                "body": "Thank you for your inquiry! We will get back to you shortly.",
                "text": "Thank you for your inquiry! We will get back to you shortly.",
                "author": {
                    "id": "tea_123ghi",
                    "email": "leela@planet-express.com",
                    "first_name": "Turanga",
                    "last_name": "Leela"
                },
                "recipients": [
                    {
                        "handle": "customer@example.com",
                        "role": "to"
                    }
                ],
                "created_at": 1678886400.0
            }
        },
        "conversation": {
            "id": "cnv_123ghi",
            "subject": "Re: New Order Inquiry",
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
                event_types: ['outbound_message', 'outbound_reply'], // Subscribe to both events
            }
        );

        await context.store.put<WebhookInformation>('_new_outbound_message_trigger', {
            webhookId: response.id,
        });
    },

    async onDisable(context) {
        const webhook = await context.store.get<WebhookInformation>(
            '_new_outbound_message_trigger'
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
            target: { data: { author: { id: string } } };
            conversation: { id: string; inbox_id: string };
        };

        const inboxFilter = context.propsValue.inbox_id;
        const teammateFilter = context.propsValue.teammate_id;

        // Filter by inbox if specified
        if (inboxFilter && payload.conversation.inbox_id !== inboxFilter) {
            return [];
        }

        // Filter by teammate if specified
        if (teammateFilter && payload.target.data.author?.id !== teammateFilter) {
            return [];
        }

        return [payload.target.data];
    },
});