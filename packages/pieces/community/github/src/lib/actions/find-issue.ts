import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubCommon, githubPaginatedApiCall, RequestParams } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindIssueAction = createAction({
  auth: githubAuth,
  name: 'find_issue',
  displayName: 'Find Issue',
  description: 'Locate an issue by search filters (state, label, etc.).',
  props: {
    repository: githubCommon.repositoryDropdown,
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Filter issues by their state.',
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
    assignee: githubCommon.assigneeSingleDropdown(false),
    creator: Property.ShortText({
        displayName: 'Creator',
        description: 'Filter issues created by this user (username).',
        required: false,
    }),
    mentioned: Property.ShortText({
        displayName: 'Mentioned User',
        description: 'Filter issues that mention this user (username).',
        required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;

    // Construct query parameters from the provided filters
    const query: RequestParams = {};
    if (propsValue.state) query.state = propsValue.state;
    if (propsValue.assignee) query.assignee = propsValue.assignee;
    if (propsValue.creator) query.creator = propsValue.creator;
    if (propsValue.mentioned) query.mentioned = propsValue.mentioned;
    if (propsValue.labels && propsValue.labels.length > 0) {
      // The API expects a comma-separated string for labels
      query.labels = propsValue.labels.join(',');
    }

    // Use the paginated call to get all matching issues
    const issues = await githubPaginatedApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues`,
      query: query,
    });

    return issues;
  },
});