import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const unstarConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_unstar_conversation',
  displayName: 'Unstar Conversation',
  description: 'Removes the star from a conversation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the star from a Podio conversation for the connected user. Starred conversations are listed by Get Flagged Conversations with the flag "starred".',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/conversation/${propsValue.conversationId}/star` });
  },
});
