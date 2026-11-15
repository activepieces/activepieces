import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getArticleById = createAction({
  auth: asknewsAuth,
  name: 'getArticleById',
  classification: 'READ',
  displayName: 'Get Article by ID',
  description: 'Get one or more articles by their IDs.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one or more news articles by their AskNews UUID(s). Choose this when you already hold article UUIDs (e.g. from a prior search) and need their full enriched records. Requires at least one valid UUID. Read-only lookup and idempotent.',
    idempotent: true,
  },
  props: {
    articleIds: Property.Array({
      displayName: 'Article IDs',
      description:
        'UUIDs from a Search News step set to Structured Data.',
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
