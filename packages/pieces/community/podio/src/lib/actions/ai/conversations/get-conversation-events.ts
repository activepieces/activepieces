import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetConversationEventsOutputSchema } from '../../../output-schemas';

export const getConversationEventsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_conversation_events',
  outputSchema: podioGetConversationEventsOutputSchema,
  displayName: 'Get Conversation Events',
  description: 'Lists the messages and other events in a conversation.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the events of one Podio conversation, newest first: its messages and changes such as participants being added. Use it to read what was said. The conversation id comes from Get Conversations, Search Conversations or Create Conversation.',
    idempotent: true,
  },
  props: {
    conversationId: podioAiProps.id({ required: true, displayName: 'Conversation ID', description: 'The id of the conversation, from Get Conversations, Search Conversations or Create Conversation.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of events to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const events = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/conversation/${propsValue.conversationId}/event/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset } }),
    });
    return { events, count: events.length };
  },
});
