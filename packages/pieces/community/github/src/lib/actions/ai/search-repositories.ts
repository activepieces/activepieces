import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubSearchRepositoriesAction = createAction({
  auth: githubAuth,
  name: 'search_repositories',
  displayName: 'Search Repositories (Agent)',
  description: 'Searches public/accessible repositories with a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches repositories (GET /search/repositories?q=) using GitHub query qualifiers like "language:", "stars:", "user:", "org:". Use to resolve owner/repo from a description. Returns a search result (total_count + items) capped at 1000 matches; pass page/per_page to page through. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description:
        'Search query with optional qualifiers, e.g. "topic:cli language:go stars:>100".',
      required: true,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Stars', value: 'stars' },
          { label: 'Forks', value: 'forks' },
          { label: 'Help Wanted Issues', value: 'help-wanted-issues' },
          { label: 'Updated', value: 'updated' },
        ],
      },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Results per page (max 100).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const query: RequestParams = { q: propsValue.q };
    if (propsValue.sort) query['sort'] = propsValue.sort;
    if (propsValue.order) query['order'] = propsValue.order;
    if (propsValue.per_page) query['per_page'] = propsValue.per_page;
    if (propsValue.page) query['page'] = propsValue.page;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/search/repositories`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, 'Repository search');
    }
  },
});
