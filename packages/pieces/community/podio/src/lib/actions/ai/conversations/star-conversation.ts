import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const starConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_star_conversation',
  displayName: 'Star Conversation',
  description: 'Stars a conversation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stars a Podio conversation for the connected user; starring an already starred conversation changes nothing. Unstar Conversation reverses it. The conversation id comes from Get Conversations or Search Conversations.',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/conversation/${propsValue.conversationId}/star` });
  },
});
