import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const listConversationsAction = createAction({
    auth: codyAuth,
    name: 'list_conversations',
    displayName: 'List Conversations',
    description: 'List or search conversations in the Cody workspace.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Lists conversations in the Cody workspace, optionally filtered by owning bot ID and/or a name keyword (partial match). Use to resolve an existing conversation to its ID before sending a message; unlike Get Conversation this returns many and all filters are optional. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        bot_id: Property.ShortText({
            displayName: 'Bot ID',
            description:
                'Optional bot ID to list conversations for. Resolve via List Bots. Omit to list across all bots.',
            required: false,
        }),
        keyword: Property.ShortText({
            displayName: 'Keyword',
            description:
                'Optional name keyword to filter conversations by (partial match). Omit to list all.',
            required: false,
        }),
    },
    async run(context) {
        const { bot_id, keyword } = context.propsValue;
        const apiKey = context.auth;

        const conversations = await codyClient.listConversations(apiKey, {
            botId: bot_id,
            keyword,
        });

        return {
            conversations,
            count: conversations.length,
        };
    },
});
