import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchStories = createAction({
  auth: asknewsAuth,
  name: 'searchStories',
  classification: 'SEARCH',
  displayName: 'Search Stories',
  description: 'Find top news stories, each grouping articles on one event.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches AskNews for top news narratives and story clusters (grouped multi-article events) rather than individual articles. The query is optional: with no query it returns top trending stories filtered by category/sort, and with a query it filters to matching narratives via keyword, semantic, or hybrid matching. Choose this for the big-picture narrative view over a topic. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['query', 'method', 'categories'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['sort_by', 'expand_updates'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Keywords or a question. Leave empty for top stories.',
      placeholder: 'Climate summit',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Search Method',
      description:
        'Keyword matches exact words; Natural Language matches meaning.',
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
      description: 'Only return stories in these categories.',
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
      displayName: 'Include Updates',
      description: "Add each story's later updates to the results.",
      required: false,
      defaultValue: false,
    }),

    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Newest first unless you pick another order.',
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
