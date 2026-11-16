import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioAddConversationParticipantsOutputSchema } from '../../../output-schemas';

export const addConversationParticipantsAction = createAction({
  auth: podioAuth,
  name: 'podio_add_conversation_participants',
  outputSchema: podioAddConversationParticipantsOutputSchema,
  displayName: 'Add Conversation Participants',
  description: 'Adds people to an existing conversation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds users to an existing Podio conversation so they can read and reply to it. The conversation id comes from Get Conversations, Search Conversations or Create Conversation; user ids come from List Space Members or Get Organization Members.',
    idempotent: false,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
    participants: podioAiProps.idList({ required: true, displayName: 'Participant User IDs', description: 'The user ids of the people to add.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/conversation/${propsValue.conversationId}/participant/v2/`,
      body: { participants: propsValue.participants.map((userId) => Number(userId)) },
    });
  },
});
