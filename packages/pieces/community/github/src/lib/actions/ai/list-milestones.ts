import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListMilestonesAction = createAction({
  auth: githubAuth,
  name: 'list_milestones',
  displayName: 'List Milestones (Agent)',
  description: 'Lists the milestones in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the milestones in a repository (GET /repos/{owner}/{repo}/milestones) filtered by state. Use to resolve a milestone number for Update Issue. Returns all pages. Read-only and idempotent.',
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
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    const query: RequestParams = {};
    if (propsValue.state) query['state'] = propsValue.state;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/milestones`,
        query,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
