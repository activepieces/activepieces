import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubFindIssue = createAction({
  auth: githubAuth,
  name: 'findIssue',
  displayName: 'Find Issue',
  description: 'Search for issues in a repository using various filters',
  props: {
    repository: githubCommon.repositoryDropdown,
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query to filter issues (e.g., keywords in title or body)',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Filter by issue state',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Filter by labels (array of label names)',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'Filter by assignee username (use "none" for issues with no assignee)',
      required: false,
    }),
    creator: Property.ShortText({
      displayName: 'Creator',
      description: 'Filter by issue creator username',
      required: false,
    }),
    mentioned: Property.ShortText({
      displayName: 'Mentioned User',
      description: 'Filter by mentioned username',
      required: false,
    }),
    milestone: Property.ShortText({
      displayName: 'Milestone',
      description: 'Filter by milestone title or number',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort results by this field',
      required: false,
      options: {
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
          { label: 'Comments', value: 'comments' },
        ],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort direction',
      required: false,
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (max 100)',
      required: false,
      defaultValue: 30,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;

    // Build query parameters for GitHub API
    const queryParams: Record<string, any> = {};

    // Add filters
    if (propsValue.state) {
      queryParams.state = propsValue.state;
    }

    if (propsValue.labels && Array.isArray(propsValue.labels) && propsValue.labels.length > 0) {
      queryParams.labels = propsValue.labels.join(',');
    }

    if (propsValue.assignee) {
      queryParams.assignee = propsValue.assignee;
    }

    if (propsValue.creator) {
      queryParams.creator = propsValue.creator;
    }

    if (propsValue.mentioned) {
      queryParams.mentioned = propsValue.mentioned;
    }

    if (propsValue.milestone) {
      queryParams.milestone = propsValue.milestone;
    }

    if (propsValue.sort) {
      queryParams.sort = propsValue.sort;
    }

    if (propsValue.direction) {
      queryParams.direction = propsValue.direction;
    }

    if (propsValue.per_page) {
      queryParams.per_page = Math.min(propsValue.per_page, 100); // GitHub API limit
    }

    if (propsValue.page) {
      queryParams.page = propsValue.page;
    }

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues`,
      query: queryParams,
    });

    return response;
  },
});
