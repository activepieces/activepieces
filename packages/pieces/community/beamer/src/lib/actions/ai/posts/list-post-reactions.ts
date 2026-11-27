import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerUtils } from '../../../common/utils';
import { beamerListPostReactionsOutputSchema } from '../../../output-schemas';

export const listPostReactionsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_list_post_reactions',
  outputSchema: beamerListPostReactionsOutputSchema,
  displayName: 'List Post Reactions',
  description: 'Lists the reactions users left on a Beamer post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the end-user reactions on one Beamer post, one page at a time (at most 10 per page; Page starts at 0). Get the post ID from List Posts; use Count Post Reactions for a total.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
    reaction: Property.StaticDropdown({ displayName: 'Reaction', description: 'Only include this reaction type.', required: false, options: { options: [ { label: 'Positive', value: 'positive' }, { label: 'Neutral', value: 'neutral' }, { label: 'Negative', value: 'negative' } ] } }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
    limit: beamerAiProps.limit({ required: false }),
    page: beamerAiProps.page({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkReaction({ reaction: propsValue.reaction });
    const reactions = await beamerClient.request<Record<string, unknown>[]>({
      auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(propsValue.postId)}/reactions`,
      query: {
        reaction: propsValue.reaction,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
        maxResults: beamerUtils.pageSize({ limit: propsValue.limit }),
        page: propsValue.page === undefined ? undefined : String(propsValue.page),
      },
    });
    return { reactions, count: reactions.length };
  },
});
