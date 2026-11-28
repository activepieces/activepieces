import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import type { BeamerPost } from '../../../common/types';
import { beamerUtils } from '../../../common/utils';
import { beamerListPostsOutputSchema } from '../../../output-schemas';

export const listPostsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_list_posts',
  outputSchema: beamerListPostsOutputSchema,
  displayName: 'List Posts',
  description: 'Lists Beamer posts, newest first, with optional filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Beamer posts one page at a time (at most 10 per page; Page starts at 0), drafts and archived posts included unless filtered out. Use it to find a post ID for Get Post, Update Post or Delete Post. Does not record views.',
    idempotent: true,
  },
  props: {
    published: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Published',
      description: '"true" for published posts only, "false" for drafts only. Unset returns both.',
    }),
    archived: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Archived',
      description: '"true" for archived posts only, "false" for non-archived only. Unset returns both.',
    }),
    category: beamerAiProps.category({ required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
    limit: beamerAiProps.limit({ required: false }),
    page: beamerAiProps.page({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    const posts = await beamerClient.request<BeamerPost[]>({
      auth,
      method: HttpMethod.GET,
      path: '/posts',
      query: {
        published: propsValue.published,
        archived: propsValue.archived,
        category: propsValue.category,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
        maxResults: beamerUtils.pageSize({ limit: propsValue.limit }),
        page: propsValue.page === undefined ? undefined : String(propsValue.page),
        saveViews: 'false',
        ignoreRequestDetails: 'true',
      },
    });
    return { posts, count: posts.length };
  },
});
