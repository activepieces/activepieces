import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetConversationEventOutputSchema } from '../../../output-schemas';

export const getConversationEventAction = createAction({
  auth: podioAuth,
  name: 'podio_get_conversation_event',
  outputSchema: podioGetConversationEventOutputSchema,
  displayName: 'Get Conversation Event',
  description: 'Gets one event in a conversation, such as a message or a participant joining.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one event of a Podio conversation, such as a message or a participant being added. The event id comes from Get Conversation Events or Reply To Conversation.',
    idempotent: true,
  },
  props: {
    eventId: podioAiProps.id({ required: true, displayName: 'Event ID', description: 'The id of the conversation event, from Get Conversation Events or Reply To Conversation.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/conversation/event/${propsValue.eventId}` });
  },
});
