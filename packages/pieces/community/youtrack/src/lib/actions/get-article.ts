import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { ARTICLE_DETAIL_FIELDS, articleDetails, articleDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { getArticleActionOutputSchema } from '../output-schemas';

export const getArticleAction = createAction({
  auth: youtrackAuth,
  name: 'get_article',
  classification: 'READ',
  outputSchema: getArticleActionOutputSchema,
  displayName: 'Get Article',
  description: 'Gets a Knowledge Base article with its content.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one Knowledge Base article by ID (from Search Articles): summary, Markdown content, project, parent, child articles and tags. Read-only and idempotent.',
    idempotent: true,
  },
  props: { article: articleDropdown },
  async run(context) {
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/articles/${youtrackClient.segment({ value: context.propsValue.article, label: 'Article' })}`,
      query: { fields: ARTICLE_DETAIL_FIELDS },
      operation: 'read the article',
    });
    return articleDetails(youtrackClient.recordOf(response));
  },
});
