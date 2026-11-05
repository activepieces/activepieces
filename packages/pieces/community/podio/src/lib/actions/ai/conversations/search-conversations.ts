import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetConversationsOutputSchema } from '../../../output-schemas';

export const searchConversationsAction = createAction({
  auth: podioAuth,
  name: 'podio_search_conversations',
  outputSchema: podioGetConversationsOutputSchema,
  displayName: 'Search Conversations',
  description: 'Finds your conversations by text in their subject and messages, or by participant.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds the connected user\'s Podio conversations whose subject or messages match a text, most recently active first; with Search Participants set to "true" it matches participant names and emails instead. To list all conversations use Get Conversations.',
    idempotent: true,
  },
  props: {
    text: podioAiProps.text({ required: true, displayName: 'Search Text', description: 'The text to search for.' }),
    searchParticipants: podioAiProps.bool({ required: false, displayName: 'Search Participants', description: '"true" matches the text against participant names and emails instead of subjects and messages. Defaults to "false".' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of conversations to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const conversations = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/conversation/search/',
      query: podioUtils.query({
        values: {
          text: propsValue.text,
          participants: podioUtils.toBool({ value: propsValue.searchParticipants }),
          limit: propsValue.limit,
          offset: propsValue.offset,
        },
      }),
    });
    return { conversations, count: conversations.length };
  },
});
