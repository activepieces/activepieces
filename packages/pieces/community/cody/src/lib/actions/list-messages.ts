import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { listMessagesOutputSchema } from '../output-schemas';

export const listMessagesAction = createAction({
    auth: codyAuth,
    name: 'list_messages',
    displayName: 'List Messages',
    description: "List the messages in a Cody conversation.",
    audience: 'ai',
    aiMetadata: {
        description:
            "Lists the message history of a single Cody conversation, returning each message's ID and content. The conversation ID is required (the list is scoped to one conversation); resolve it via List Conversations. Use to read a thread's history; to fetch one message use Get Message. Read-only and safe to retry.",
        idempotent: true,
    },
    outputSchema: listMessagesOutputSchema,
    props: {
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description:
                'The ID of the conversation whose messages to list. Resolve via List Conversations.',
            required: true,
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Optional 1-based page number for pagination.',
            required: false,
        }),
        per_page: Property.Number({
            displayName: 'Per Page',
            description: 'Optional number of messages to return per page.',
            required: false,
        }),
    },
    async run(context) {
        const { conversation_id, page, per_page } = context.propsValue;
        const apiKey = context.auth;

        const queryParams: Record<string, string> = {
            conversation_id,
        };
        if (page !== undefined && page !== null) {
            queryParams['page'] = String(page);
        }
        if (per_page !== undefined && per_page !== null) {
            queryParams['per_page'] = String(per_page);
        }

        return await codyClient.get(apiKey, `/messages`, queryParams);
    },
});
