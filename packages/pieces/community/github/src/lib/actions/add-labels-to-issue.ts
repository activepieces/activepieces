import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubAddLabelsToIssueAction = createAction({
  auth: githubAuth,
  name: 'add_labels_to_issue',
  displayName: 'Add Labels to Issue',
  description: 'Adds labels to an existing issue.',
  props: {
    repository: githubCommon.repositoryDropdown,
// UPDATED: Replaced the number property with the issue dropdown
    issue_number: githubCommon.issueDropdown(true), 
    labels: githubCommon.labelDropDown(true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    // The issue_number now comes from the dropdown's selection
    const issue_number = propsValue.issue_number;
    const labels = propsValue.labels;

    // The API call to add the labels
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
      body: {
        labels: labels,
      },
    });

    return response.body;
  },
});