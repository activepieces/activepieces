import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const leaveConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_leave_conversation',
  displayName: 'Leave Conversation',
  description: 'Leaves a conversation so it no longer shows in your inbox.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the connected user from a Podio conversation. Only another participant can add the user back, with Add Conversation Participants. The conversation id comes from Get Conversations, Search Conversations or Create Conversation.',
    idempotent: false,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/conversation/${propsValue.conversationId}/leave` });
  },
});
