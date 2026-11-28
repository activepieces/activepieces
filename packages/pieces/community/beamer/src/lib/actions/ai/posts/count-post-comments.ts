import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import type { BeamerCount } from '../../../common/types';
import { beamerCountPostCommentsOutputSchema } from '../../../output-schemas';

export const countPostCommentsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_count_post_comments',
  outputSchema: beamerCountPostCommentsOutputSchema,
  displayName: 'Count Post Comments',
  description: 'Counts the comments on a Beamer post.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many end-user comments one Beamer post has, optionally filtered. Get the post ID from List Posts; use List Post Comments to read them.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
    search: Property.ShortText({ displayName: 'Search', description: 'Only include comments whose text contains this.', required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await beamerClient.request<BeamerCount>({
      auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(propsValue.postId)}/comments/count`,
      query: {
        search: propsValue.search,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
      },
    });
  },
});
