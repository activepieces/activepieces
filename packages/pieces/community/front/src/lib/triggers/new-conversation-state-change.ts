import {
    createTrigger,
    TriggerStrategy,
    Property,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxDropdown } from '../common/props';

interface WebhookInformation {
    webhookId: string;
}

export const newConversationStateChange = createTrigger({
    auth: frontAuth,
    name: 'new_conversation_state_change',
    displayName: 'New Conversation State Change',
    description: 'Fires when a conversation is archived, assigned, unassigned, or trashed.',
    props: {
        state: Property.StaticDropdown({
            displayName: 'State',
            description: 'The conversation state to trigger on.',
            required: true,
            options: {
                options: [
                    { label: 'Assigned', value: 'assigned' },
                    { label: 'Unassigned', value: 'unassigned' },
                    { label: 'Archived', value: 'archived' },
                    { label: 'Trashed', value: 'trashed' },
                ]
            }
        }),
        inbox_id: inboxDropdown,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "_links": { "self": "https://api2.frontapp.com/events/evt_123jkl" },
        "id": "evt_123jkl",
        "type": "assign",
        "status": "delivered",
        "target": {
            "_links": {
                "related": {
                    "assignee": "https://api2.frontapp.com/teammates/tea_123jkl",
                    "conversation": "https://api2.frontapp.com/conversations/cnv_123jkl"
                }
            },
            "data": {}
        },
        "conversation": {
            "id": "cnv_123jkl",
            "subject": "Need help with my account",
            "status": "assigned",
            "assignee": {
                "id": "tea_123jkl",
                "email": "fry@planet-express.com",
                "username": "fry",
                "first_name": "Philip",
                "last_name": "Fry"
            },
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
                event_types: [
                    'assign',
                    'unassign',
                    'archive',
                    'reopen',
                    'trash',
                    'restore',
                ],
            }
        );

        await context.store.put<WebhookInformation>('_new_conversation_state_change_trigger', {
            webhookId: response.id,
        });
    },

    async onDisable(context) {
        const webhook = await context.store.get<WebhookInformation>(
            '_new_conversation_state_change_trigger'
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
            conversation: { id: string; status: string; inbox_id: string };
        };

        const stateFilter = context.propsValue.state;
        const inboxFilter = context.propsValue.inbox_id;

        // The API uses 'deleted' for the 'trashed' state.
        const targetStatus = stateFilter === 'trashed' ? 'deleted' : stateFilter;

        // If the resulting conversation status doesn't match the desired state, ignore it.
        if (payload.conversation.status !== targetStatus) {
            return [];
        }

        // If an inbox is selected, only run for that inbox.
        if (inboxFilter && payload.conversation.inbox_id !== inboxFilter) {
            return [];
        }

        return [payload.conversation];
    },
});