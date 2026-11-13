import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetFlaggedConversationCountsOutputSchema } from '../../../output-schemas';

export const getFlaggedConversationCountsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flagged_conversation_counts',
  outputSchema: podioGetFlaggedConversationCountsOutputSchema,
  displayName: 'Get Flagged Conversation Counts',
  description: 'Counts your unread or starred conversations.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many of the connected user\'s Podio conversations carry a flag: "unread" or "starred". To list those conversations use Get Flagged Conversations.',
    idempotent: true,
  },
  props: {
    flag: podioAiProps.choice({ required: true, displayName: 'Flag', description: '"unread" or "starred".', values: flagValues() }),
  },
  async run({ auth, propsValue }) {
    if (!flagValues().includes(propsValue.flag)) {
      throw new Error(`Flag must be one of: ${flagValues().join(', ')}.`);
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/conversation/${propsValue.flag}/count` });
  },
});

function flagValues(): string[] {
  return ['unread', 'starred'];
}
