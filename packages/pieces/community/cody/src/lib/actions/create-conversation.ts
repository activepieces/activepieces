import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { botIdDropdown } from '../common/props';

export const createConversationAction = createAction({
  auth: codyAuth,
  name: 'create_conversation',
  displayName: 'Create Conversation',
  description: 'Creates a new conversation with a bot.',
  audience: 'both',
  aiMetadata: { description: 'Starts a new conversation thread with a specific Cody bot, returning a conversation ID to use with Send Message. Optionally pass a list of document IDs to scope the bot knowledge base to just those documents (focus mode). Requires a bot ID and a name; creates a new conversation each call, so it is not idempotent.', idempotent: false },
  props: {
    bot_id: botIdDropdown,
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'The name for the new conversation.',
      required: true,
    }),
    document_ids: Property.Array({
      displayName: 'Document IDs (Focus Mode)',
      description:
        "A list of document IDs to limit the bot's knowledge base for this conversation.",
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
