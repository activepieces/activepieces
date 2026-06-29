import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListPullRequestsAction = createAction({
  auth: githubAuth,
  name: 'list_pull_requests',
  displayName: 'List Pull Requests (Agent)',
  description: 'Lists pull requests in a repository with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists pull requests in a repository (GET /repos/{owner}/{repo}/pulls) filtered by state, head (user:branch), base branch, and sort. Returns all pages. For cross-repo or qualifier-based search use Search Issues and Pull Requests. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    head: Property.ShortText({
      displayName: 'Head',
      description: 'Filter by head branch in the form "user:branch".',
      required: false,
    }),
    base: Property.ShortText({
      displayName: 'Base',
      description: 'Filter by base branch name.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
          { label: 'Popularity', value: 'popularity' },
          { label: 'Long Running', value: 'long-running' },
        ],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: false,
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    const query: RequestParams = {};
    if (propsValue.state) query['state'] = propsValue.state;
    if (propsValue.head) query['head'] = propsValue.head;
    if (propsValue.base) query['base'] = propsValue.base;
    if (propsValue.sort) query['sort'] = propsValue.sort;
    if (propsValue.direction) query['direction'] = propsValue.direction;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/pulls`,
        query,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
