import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { sendMessageAiOutputSchema } from '../output-schemas';

export const sendMessageAiAction = createAction({
    auth: codyAuth,
    name: 'send_message_ai',
    displayName: 'Send Message (AI)',
    description: 'Send a message to a Cody conversation and get the bot reply.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Posts a message to an existing Cody conversation and returns the bot AI-generated reply. Use to query a bot within an already-created conversation thread; resolve or create the conversation ID first via List Conversations or Create Conversation. This is the non-streaming verb (returns the full reply as a single object). Requires the conversation ID and message text (max 2000 characters); each call appends a new message, so it is not idempotent.',
        idempotent: false,
    },
    outputSchema: sendMessageAiOutputSchema,
    props: {
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description:
                'The ID of the conversation to post into. Resolve via List Conversations or Create Conversation.',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Message',
            description: 'The message to send to the conversation. Max 2000 characters.',
            required: true,
        }),
    },
    async run(context) {
        const { conversation_id, content } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.sendMessage(apiKey, conversation_id, content);
    },
});
