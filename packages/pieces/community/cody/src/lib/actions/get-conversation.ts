import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { getConversationOutputSchema } from '../output-schemas';

export const getConversationAction = createAction({
    auth: codyAuth,
    name: 'get_conversation',
    displayName: 'Get Conversation',
    description: 'Retrieve a single Cody conversation by its ID.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Retrieves the details of a single Cody conversation by its ID. Use when you already have the conversation ID (from List Conversations or Create Conversation) and want its full detail; to search across many conversations use List Conversations instead. Optionally request includes (document_ids and/or messages) to embed the focus documents or message history. Read-only and safe to retry.',
        idempotent: true,
    },
    outputSchema: getConversationOutputSchema,
    props: {
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'The ID of the conversation to retrieve. Resolve via List Conversations.',
            required: true,
        }),
        includes: Property.ShortText({
            displayName: 'Includes',
            description:
                "Optional comma-separated related data to embed in the response. One or more of: 'document_ids', 'messages'.",
            required: false,
        }),
    },
    async run(context) {
        const { conversation_id, includes } = context.propsValue;
        const apiKey = context.auth;

        const queryParams: Record<string, string> = {};
        if (includes) {
            queryParams['includes'] = includes;
        }

        return await codyClient.get(apiKey, `/conversations/${conversation_id}`, queryParams);
    },
});
