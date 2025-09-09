import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubAddLabelsToIssueAction = createAction({
  auth: githubAuth,
  name: 'addLabelsToIssue',
  displayName: 'Add Labels to Issue',
  description: 'Adds labels to an existing issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to modify',
      required: true,
    }),
    labels: githubCommon.labelDropDown(true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const issue_number = (propsValue as any).issue_number;
    const labels = (propsValue as any).labels;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels`,
      body: { labels },
    });

    return response;
  },
});
