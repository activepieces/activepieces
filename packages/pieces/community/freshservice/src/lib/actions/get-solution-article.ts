import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const getSolutionArticle = createAction({
  auth: freshserviceAuth,
  name: 'get_solution_article',
  displayName: 'Get Solution Article',
  description: 'Retrieves a specific solution article by its ID.',
  props: {
    article_id: Property.Number({
      displayName: 'Article ID',
      description: 'The ID of the solution article to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ article: Record<string, unknown> }>({
      method: HttpMethod.GET,
      endpoint: `solutions/articles/${context.propsValue.article_id}`,
      auth: context.auth,
    });

    return response.body.article;
  },
});
