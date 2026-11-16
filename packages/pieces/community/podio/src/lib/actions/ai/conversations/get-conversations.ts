import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetConversationsOutputSchema } from '../../../output-schemas';

export const getConversationsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_conversations',
  outputSchema: podioGetConversationsOutputSchema,
  displayName: 'Get Conversations',
  description: 'Lists your conversations, most recently active first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the connected user\'s Podio conversations, ordered by their latest event. To find conversations by text use Search Conversations; for only unread or starred ones use Get Flagged Conversations.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of conversations to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const conversations = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/conversation/',
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset } }),
    });
    return { conversations, count: conversations.length };
  },
});
