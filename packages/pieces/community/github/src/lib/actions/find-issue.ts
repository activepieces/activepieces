import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findIssue = createAction({
  auth: githubAuth,
  name: 'findIssue',
  displayName: 'Find Issue',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
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
    labels: githubCommon.labelDropDown(false),
    search: Property.ShortText({
      displayName: 'Search in title',
      description: 'Keyword to match in the issue title',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;
    const query: Record<string, string> = {};
    if (propsValue.state) query.state = propsValue.state;
    if (propsValue.labels && propsValue.labels.length > 0) {
      query.labels = propsValue.labels.join(',');
    }

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues`,
      query,
    });

    let issues = response.body as any[];
    if (propsValue.search) {
      const searchTerm = propsValue.search.toLowerCase();
      issues = issues.filter((issue: any) =>
        issue.title.toLowerCase().includes(searchTerm)
      );
    }

    return issues;
  },
});
