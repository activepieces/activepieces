import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const markConversationAsReadAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_conversation_as_read',
  displayName: 'Mark Conversation As Read',
  description: 'Marks one conversation as read.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks one Podio conversation as read for the connected user; Mark Conversation As Unread reverses it. The conversation id comes from Get Conversations, Get Flagged Conversations or Search Conversations.',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/conversation/${propsValue.conversationId}/read` });
  },
});
