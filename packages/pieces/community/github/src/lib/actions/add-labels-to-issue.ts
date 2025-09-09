import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubAddLabelsToIssue = createAction({
  auth: githubAuth,
  name: 'addLabelsToIssue',
  displayName: 'Add Labels to Issue',
  description: 'Add labels to an existing issue. Pass an empty array to remove all labels.',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to add labels to',
      required: true,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Array of label names to add to the issue. Pass an empty array to remove all labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;
    const labels = propsValue.labels;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
      body: {
        labels: labels,
      },
    });

    return response;
  },
});
