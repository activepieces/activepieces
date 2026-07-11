import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dixaAuth } from '../auth';
import { dixaClient } from '../common/client';

export const getArticle = createAction({
  auth: dixaAuth,
  name: 'get_article',
  displayName: 'Get Article',
  description: 'Get an article from Dixa knowledge base.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve a knowledge base article from Dixa by its article ID.',
    idempotent: true,
  },
  props: {
    articleId: Property.ShortText({
      displayName: 'Article ID',
      description: 'The ID of the article to get',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { articleId } = propsValue;

    return await dixaClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/knowledge/articles/${articleId}`
    );
  },
});
