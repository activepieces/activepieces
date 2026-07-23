import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { createConversationAiOutputSchema } from '../output-schemas';

export const createConversationAiAction = createAction({
    auth: codyAuth,
    name: 'create_conversation_ai',
    displayName: 'Create Conversation (AI)',
    description: 'Start a new conversation thread with a Cody bot.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Starts a new conversation thread with a specific Cody bot, returning a conversation ID to use with Send Message. Resolve the bot ID first via List Bots. Optionally pass document IDs (from List Documents, max 1000) to scope the bot to just those documents (focus mode). Requires a bot ID and a name; creates a new conversation each call, so it is not idempotent.',
        idempotent: false,
    },
    outputSchema: createConversationAiOutputSchema,
    props: {
        bot_id: Property.ShortText({
            displayName: 'Bot ID',
            description: 'The ID of the bot to converse with. Resolve via List Bots.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Conversation Name',
            description: 'The name for the new conversation.',
            required: true,
        }),
        document_ids: Property.Array({
            displayName: 'Document IDs (Focus Mode)',
            description:
                "A list of document IDs to limit the bot's knowledge base for this conversation (focus mode, max 1000). Resolve via List Documents. Omit to use the bot's full knowledge base.",
            required: false,
        }),
    },
    async run(context) {
        const { bot_id, name, document_ids } = context.propsValue;
        const apiKey = context.auth;

        const docIds = document_ids as string[] | undefined;

        return await codyClient.createConversation(apiKey, bot_id, name, docIds);
    },
});
