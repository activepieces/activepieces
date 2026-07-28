import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { deleteConversationOutputSchema } from '../output-schemas';

export const deleteConversationAction = createAction({
    auth: codyAuth,
    name: 'delete_conversation',
    displayName: 'Delete Conversation',
    description: 'Permanently delete a Cody conversation by its ID.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Permanently deletes a Cody conversation by its ID, including its message history. This is destructive and cannot be undone (Cody has no archive). Resolve the conversation ID via List Conversations and confirm it is the correct one before calling. A retry on an already-deleted conversation returns a 404, so it is not idempotent.',
        idempotent: false,
    },
    outputSchema: deleteConversationOutputSchema,
    props: {
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description:
                'The ID of the conversation to permanently delete. Resolve via List Conversations.',
            required: true,
        }),
    },
    async run(context) {
        const { conversation_id } = context.propsValue;
        const apiKey = context.auth;

        await codyClient.delete(apiKey, `/conversations/${conversation_id}`);

        return {
            success: true,
            conversation_id,
        };
    },
});
