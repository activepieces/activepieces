import { githubAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubAddLabelsToIssueAction = createAction({
  auth: githubAuth,
  name: 'add_labels_to_issue',
  displayName: 'Add Labels to Issue',
  description: 'Adds labels to an existing issue.',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: githubCommon.issueDropdown(true),
    labels: githubCommon.labelDropDown(true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const issue_number = propsValue.issue_number;
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
