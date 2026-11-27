import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import type { BeamerCount } from '../../../common/types';
import { beamerUtils } from '../../../common/utils';
import { beamerCountPostCommentsOutputSchema } from '../../../output-schemas';

export const countPostReactionsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_count_post_reactions',
  outputSchema: beamerCountPostCommentsOutputSchema,
  displayName: 'Count Post Reactions',
  description: 'Counts the reactions on a Beamer post.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many end-user reactions one Beamer post has, optionally filtered. Get the post ID from List Posts; use List Post Reactions to read them.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
    reaction: Property.StaticDropdown({ displayName: 'Reaction', description: 'Only include this reaction type.', required: false, options: { options: [ { label: 'Positive', value: 'positive' }, { label: 'Neutral', value: 'neutral' }, { label: 'Negative', value: 'negative' } ] } }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkReaction({ reaction: propsValue.reaction });
    return await beamerClient.request<BeamerCount>({
      auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(propsValue.postId)}/reactions/count`,
      query: {
        reaction: propsValue.reaction,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
      },
    });
  },
});
