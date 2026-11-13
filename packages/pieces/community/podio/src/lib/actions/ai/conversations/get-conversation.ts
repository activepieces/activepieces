import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetConversationOutputSchema } from '../../../output-schemas';

export const getConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_conversation',
  outputSchema: podioGetConversationOutputSchema,
  displayName: 'Get Conversation',
  description: 'Gets one conversation with its subject and participants.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio conversation: its subject, the object it is attached to and its participants, without the messages (use Get Conversation Events for those). Only participants can read a conversation. The conversation id comes from Get Conversations, Search Conversations or Create Conversation.',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/conversation/${propsValue.conversationId}` });
  },
});
