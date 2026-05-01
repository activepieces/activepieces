import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const deleteSolutionArticle = createAction({
  auth: freshserviceAuth,
  name: 'delete_solution_article',
  displayName: 'Delete Solution Article',
  description: 'Deletes a solution article from Freshservice.',
  props: {
    article_id: Property.Number({
      displayName: 'Article ID',
      description: 'The ID of the solution article to delete.',
      required: true,
    }),
  },
  async run(context) {
    await freshserviceApiCall({
      method: HttpMethod.DELETE,
      endpoint: `solutions/articles/${context.propsValue.article_id}`,
      auth: context.auth,
    });

    return { success: true, message: `Article ${context.propsValue.article_id} deleted successfully.` };
  },
});
