import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';

export const listSolutionArticles = createAction({
  auth: freshserviceAuth,
  name: 'list_solution_articles',
  displayName: 'List Solution Articles',
  description: 'Lists solution articles, optionally filtered by folder or category.',
  props: {
    folder_id: Property.Number({
      displayName: 'Folder ID',
      description: 'Filter articles by folder.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1).',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Number of articles per page (default: 30, max: 100).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (props.folder_id) queryParams['folder_id'] = String(props.folder_id);
    if (props.page) queryParams['page'] = String(props.page);
    if (props.per_page) queryParams['per_page'] = String(props.per_page);

    const response = await freshserviceApiCall<{ articles: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      endpoint: 'solutions/articles',
      auth: context.auth,
      queryParams,
    });

    return response.body.articles;
  },
});
