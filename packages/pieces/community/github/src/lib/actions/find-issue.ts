import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RequestParams } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindIssueAction = createAction({
  auth: githubAuth,
  name: 'find_issue',
  displayName: 'Find Issue',
  description: 'Finds an issue based title.',
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Filter issues by their state.',
      required: true,
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
    const { owner, repo } = propsValue.repository!;
    const { state, title } = propsValue;
    const query: RequestParams = {};
    if (propsValue.state) query.state = propsValue.state;

    let q = `repo:${owner}/${repo} is:issue in:title`;
    if (title) {
      q += ` "${title}"`;
    }
    if (state && state !== 'all') {
      q += ` state:${state}`;
    }

    const response = await githubApiCall<{
      total_count: number;
      items: Array<{ id: number }>;
    }>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/search/issues`,
      query: { q, per_page: 1 },
    });

    return {
      found: response.body.total_count > 0,
      result: response.body.items,
    };
  },
});
