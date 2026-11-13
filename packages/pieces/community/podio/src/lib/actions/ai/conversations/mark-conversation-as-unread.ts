import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const markConversationAsUnreadAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_conversation_as_unread',
  displayName: 'Mark Conversation As Unread',
  description: 'Marks one conversation as unread.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one Podio conversation as unread for the connected user; Mark Conversation As Read reverses it. The conversation id comes from Get Conversations, Get Flagged Conversations or Search Conversations.',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/conversation/${propsValue.conversationId}/read` });
  },
});
