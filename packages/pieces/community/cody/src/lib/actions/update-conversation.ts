import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { updateConversationOutputSchema } from '../output-schemas';

export const updateConversationAction = createAction({
    auth: codyAuth,
    name: 'update_conversation',
    displayName: 'Update Conversation',
    description: 'Update a Cody conversation (full replace of name, bot, and focus documents).',
    audience: 'ai',
    aiMetadata: {
        description:
            'Updates a Cody conversation via a full replace, not a partial patch: name AND bot ID are both required, so to change just one (e.g. rename) you must re-send the current value of the other to keep it. Focus-mode documents are part of the replace too: re-send the conversation\'s current document IDs (from Get Conversation) to keep them — omitting Document IDs may clear focus mode. Fetch the current values with Get Conversation first. Convergent set-by-key (re-sending the same values yields the same state), so it is idempotent.',
        idempotent: true,
    },
    outputSchema: updateConversationOutputSchema,
    props: {
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'The ID of the conversation to update. Resolve via List Conversations.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description:
                'The conversation name. Required (full replace): re-send the current name if you only want to change the bot.',
            required: true,
        }),
        bot_id: Property.ShortText({
            displayName: 'Bot ID',
            description:
                'The bot ID for the conversation. Required (full replace): re-send the current bot ID if you only want to rename. Resolve via List Bots.',
            required: true,
        }),
        document_ids: Property.Array({
            displayName: 'Document IDs (Focus Mode)',
            description:
                'Optional list of document IDs to set as the focus-mode documents for this conversation (full replace). Re-send the current focus documents (from Get Conversation) to keep them; omitting may clear focus mode. Resolve via List Documents.',
            required: false,
        }),
    },
    async run(context) {
        const { conversation_id, name, bot_id, document_ids } = context.propsValue;
        const apiKey = context.auth;

        const body: Record<string, unknown> = {
            name,
            bot_id,
        };
        const docIds = document_ids as string[] | undefined;
        if (docIds !== undefined) {
            body['document_ids'] = docIds;
        }

        return await codyClient.post(apiKey, `/conversations/${conversation_id}`, body);
    },
});
