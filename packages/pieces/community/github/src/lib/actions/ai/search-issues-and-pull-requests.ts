import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { githubError } from './common';

export const githubSearchIssuesAndPullRequestsAction = createAction({
  auth: githubAuth,
  name: 'search_issues_and_pull_requests',
  displayName: 'Search Issues and Pull Requests (Agent)',
  description: 'Searches issues and PRs across repositories with a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches issues and pull requests (GET /search/issues?q=) using qualifiers like "repo:owner/name", "is:issue", "is:pr", "state:open", "author:", "label:", "assignee:". The primary cross-repo issue/PR finder. Returns a search result (total_count + items) capped at 1000. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description:
        'Search query, e.g. "repo:octocat/Hello-World is:issue is:open label:bug".',
      required: true,
    }),
    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Sort field (e.g. comments, created, updated, reactions).',
      required: false,
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
        resourceUri: `/search/issues`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, 'Issue/PR search');
    }
  },
});
