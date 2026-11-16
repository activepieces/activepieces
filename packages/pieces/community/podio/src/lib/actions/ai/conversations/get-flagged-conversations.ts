import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetConversationsOutputSchema } from '../../../output-schemas';

export const getFlaggedConversationsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flagged_conversations',
  outputSchema: podioGetConversationsOutputSchema,
  displayName: 'Get Flagged Conversations',
  description: 'Lists your unread or starred conversations.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the connected user\'s Podio conversations that carry a flag: "unread" or "starred", most recently active first. For all conversations use Get Conversations; for only the number use Get Flagged Conversation Counts.',
    idempotent: true,
  },
  props: {
    flag: podioAiProps.choice({ required: true, displayName: 'Flag', description: '"unread" or "starred".', values: flagValues() }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of conversations to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!flagValues().includes(propsValue.flag)) {
      throw new Error(`Flag must be one of: ${flagValues().join(', ')}.`);
    }
    const conversations = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/conversation/${propsValue.flag}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, offset: propsValue.offset } }),
    });
    return { conversations, count: conversations.length };
  },
});

function flagValues(): string[] {
  return ['unread', 'starred'];
}
