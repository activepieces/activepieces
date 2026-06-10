import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubGetIssueInformation = createAction({
  auth: githubAuth,
  name: 'getIssueInformation',
  displayName: 'Get issue information',
  description: 'Grabs information from a specific issue',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full details of a single issue in a repository by its issue number. Use when you already know the issue number and need its current state, title, body, labels, or assignees. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue you want to get information from',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
    });

    return response;
  },
});
