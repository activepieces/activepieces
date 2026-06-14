import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { botIdDropdown } from '../common/props';

export const findConversationAction = createAction({
    auth: codyAuth,
    name: 'find_conversation',
    displayName: 'Find Conversation',
    description: 'Finds a conversation based on its name and/or the bot it belongs to.',
    audience: 'both',
    aiMetadata: { description: 'Searches Cody conversations, filtering by owning bot ID and/or by name (partial match) and returns the matches. Use to resolve an existing conversation to its ID. At least one of bot or name must be provided. This is a read-only lookup and is idempotent.', idempotent: true },
    props: {
        
        bot_id: {
            ...botIdDropdown,
            required: false,
        },
        name: Property.ShortText({
            displayName: 'Conversation Name',
            description: 'The name of the conversation to search for (partial match).',
            required: false,
        })
    },
    async run(context) {
        const { bot_id, name } = context.propsValue;
        const apiKey = context.auth;

        if (!bot_id && !name) {
            throw new Error("To find a conversation, please provide a Bot or a Conversation Name to search.");
        }

        const conversations = await codyClient.listConversations(apiKey, {
            botId: bot_id,
            keyword: name,
        });
        
        return {
            found: conversations.length > 0,
            conversations: conversations,
        };
    },
});