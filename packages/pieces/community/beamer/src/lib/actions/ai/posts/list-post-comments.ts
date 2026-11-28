import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerUtils } from '../../../common/utils';
import { beamerListPostCommentsOutputSchema } from '../../../output-schemas';

export const listPostCommentsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_list_post_comments',
  outputSchema: beamerListPostCommentsOutputSchema,
  displayName: 'List Post Comments',
  description: 'Lists the comments users left on a Beamer post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the end-user comments on one Beamer post, one page at a time (at most 10 per page; Page starts at 0). Get the post ID from List Posts; use Count Post Comments for a total.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
    search: Property.ShortText({ displayName: 'Search', description: 'Only include comments whose text contains this.', required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
    limit: beamerAiProps.limit({ required: false }),
    page: beamerAiProps.page({ required: false }),
  },
  async run({ auth, propsValue }) {
    const comments = await beamerClient.request<Record<string, unknown>[]>({
      auth,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(propsValue.postId)}/comments`,
      query: {
        search: propsValue.search,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
        maxResults: beamerUtils.pageSize({ limit: propsValue.limit }),
        page: propsValue.page === undefined ? undefined : String(propsValue.page),
      },
    });
    return { comments, count: comments.length };
  },
});
