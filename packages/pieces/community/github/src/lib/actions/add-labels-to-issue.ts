import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addLabelsToIssue = createAction({
  auth: githubAuth,
  name: 'addLabelsToIssue',
  displayName: 'Add Labels to Issue',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to which labels are to be added',
      required: true,
    }),
    labels: githubCommon.labelDropDown(true),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues/${propsValue.issue_number}/labels`,
      body: {
        labels: propsValue.labels,
      },
    });
    return response.body;
  },
});
