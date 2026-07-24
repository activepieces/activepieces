import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubSearchCodeAction = createAction({
  auth: githubAuth,
  name: 'search_code',
  displayName: 'Search Code (Agent)',
  description: 'Searches file contents across repositories.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches code (GET /search/code?q=) using qualifiers like "in:file", "repo:owner/name", "language:", "path:", "filename:". The query must include at least one search term. Returns a search result (total_count + items) capped at 1000. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description:
        'Code search query, e.g. "addClass in:file language:js repo:jquery/jquery".',
      required: true,
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
    if (propsValue.per_page) query['per_page'] = propsValue.per_page;
    if (propsValue.page) query['page'] = propsValue.page;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/search/code`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, 'Code search');
    }
  },
});
