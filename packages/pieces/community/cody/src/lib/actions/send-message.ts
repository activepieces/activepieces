import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { conversationIdDropdown } from '../common/props';

export const sendMessageAction = createAction({
    auth: codyAuth,
    name: 'send_message',
    displayName: 'Send Message',
    description: 'Send your message and receive the AI-generated response.',
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
        const apiKey = context.auth as string;

        return await codyClient.sendMessage(apiKey, conversation_id, content);
    },
});