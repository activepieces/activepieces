import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListRepositoryIssuesAction = createAction({
  auth: githubAuth,
  name: 'list_repository_issues',
  displayName: 'List Repository Issues (Agent)',
  description: 'Lists issues in a repository with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists issues in a repository (GET /repos/{owner}/{repo}/issues) with filters for state, labels, assignee, creator, milestone, since, and sort. NOTE: GitHub REST returns pull requests as issues too — items with a non-null pull_request field are PRs; filter them out if you only want issues. Returns all pages. Read-only and idempotent.',
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
    labels: Property.ShortText({
      displayName: 'Labels',
      description: 'Comma-separated list of label names to filter by.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'Filter by assignee login (or "none" / "*").',
      required: false,
    }),
    creator: Property.ShortText({
      displayName: 'Creator',
      description: 'Filter by the login of the issue creator.',
      required: false,
    }),
    milestone: Property.ShortText({
      displayName: 'Milestone',
      description: 'Milestone number, "none", or "*".',
      required: false,
    }),
    since: Property.ShortText({
      displayName: 'Since',
      description: 'Only issues updated at or after this ISO 8601 timestamp.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
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
    if (propsValue.labels) query['labels'] = propsValue.labels;
    if (propsValue.assignee) query['assignee'] = propsValue.assignee;
    if (propsValue.creator) query['creator'] = propsValue.creator;
    if (propsValue.milestone) query['milestone'] = propsValue.milestone;
    if (propsValue.since) query['since'] = propsValue.since;
    if (propsValue.sort) query['sort'] = propsValue.sort;
    if (propsValue.direction) query['direction'] = propsValue.direction;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/issues`,
        query,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
