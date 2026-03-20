import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getArticleById = createAction({
  auth: asknewsAuth,
  name: 'getArticleById',
  displayName: 'Get Article by ID',
  description:
    'Retrieve a single article or multiple articles by their UUID(s)',
  props: {
    articleIds: Property.Array({
      displayName: 'Article ID(s)',
      description:
        'One or more article UUIDs to fetch.',
      required: true,
    }),
  },
  async run(context) {
    const { articleIds } = context.propsValue as { articleIds: string[] };

    const queryParams = articleIds
      .map((id: string) => `article_ids=${encodeURIComponent(id)}`)
      .join('&');
    const endpoint = `/news?${queryParams}`;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      endpoint
    );

    return response;
  },
});
