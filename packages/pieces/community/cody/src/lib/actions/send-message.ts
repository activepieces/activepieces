import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { conversationIdDropdown } from '../common/props';

export const sendMessageAction = createAction({
    auth: codyAuth,
    name: 'send_message',
    displayName: 'Send Message',
    description: 'Send your message and receive the AI-generated response.',
    audience: 'both',
    aiMetadata: { description: 'Posts a message to an existing Cody conversation and returns the bot AI-generated reply. Use to query a bot within an already-created conversation thread. Requires the conversation ID and message text (max 2000 characters); each call appends a new message, so it is not idempotent.', idempotent: false },
    props: {
        conversation_id: conversationIdDropdown,
        content: Property.LongText({
            displayName: 'Message',
            description: 'The message to send to the conversation. (Max 2000 characters)',
            required: true,
        }),
    },
    async run(context) {
        const { conversation_id, content } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.sendMessage(apiKey, conversation_id, content);
    },
});