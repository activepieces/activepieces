import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubGetIssueInformation = createAction({
  auth: githubAuth,
  name: 'getIssueInformation',
  displayName: 'Get issue information',
  description: 'Grabs information from a specific issue',
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
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
    });

    return response;
  },
});
