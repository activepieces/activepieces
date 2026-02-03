import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchStories = createAction({
  auth: asknewsAuth,
  name: 'searchStories',
  displayName: 'Search Stories (Narrative Clusters)',
  description: 'Filter and search for top news narratives and story clusters',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Natural language or keyword query for search',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Search Method',
      description: 'nl: semantic search, kw: keyword search, both: combined',
      required: false,
      defaultValue: 'kw',
      options: {
        options: [
          { label: 'Keyword', value: 'kw' },
          { label: 'Natural Language', value: 'nl' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Categories',
      description: 'Filter stories by categories',
      required: false,
      options: {
        options: [
          { label: 'Politics', value: 'Politics' },
          { label: 'Economy', value: 'Economy' },
          { label: 'Finance', value: 'Finance' },
          { label: 'Science', value: 'Science' },
          { label: 'Technology', value: 'Technology' },
          { label: 'Sports', value: 'Sports' },
          { label: 'Climate', value: 'Climate' },
          { label: 'Environment', value: 'Environment' },
          { label: 'Culture', value: 'Culture' },
          { label: 'Entertainment', value: 'Entertainment' },
          { label: 'Business', value: 'Business' },
          { label: 'Health', value: 'Health' },
          { label: 'International', value: 'International' },
        ],
      },
    }),
    expand_updates: Property.Checkbox({
      displayName: 'Expand Updates',
      description: 'Include story updates in results',
      required: false,
      defaultValue: false,
    }),

    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort results by field',
      required: false,
      defaultValue: 'published',
      options: {
        options: [
          { label: 'Published Date', value: 'published' },
          { label: 'Coverage', value: 'coverage' },
          { label: 'Sentiment', value: 'sentiment' },
          { label: 'Relevance', value: 'relevance' },
        ],
      },
    }),
  },
  async run(context) {
    const params = context.propsValue;
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.append('query', params.query);
    if (params.method) queryParams.append('method', params.method);
    if (params.categories?.length) {
      params.categories.forEach((cat: string) =>
        queryParams.append('categories', cat)
      );
    }
    if (params.expand_updates) queryParams.append('expand_updates', 'true');
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);

    const endpoint = `/stories?${queryParams.toString()}`;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      endpoint
    );

    return response;
  },
});
