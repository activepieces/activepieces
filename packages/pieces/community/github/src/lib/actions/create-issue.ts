import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateIssueAction = createAction({
  auth: githubAuth,
  name: 'github_create_issue',
  displayName: 'Create Issue',
  description: 'Create Issue in GitHub Repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the issue',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the issue',
      required: false,
    }),
    labels: githubCommon.labelDropDown(),
    assignees: githubCommon.assigneeDropDown(),
  },
  async run({ auth, propsValue }) {
    const { title, assignees, labels, description } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const issueFields: Record<string, any> = {
      title,
      body: description,
    };

    if (labels) {
      issueFields['labels'] = labels;
    }

    if (assignees) {
      issueFields['assignees'] = assignees;
    }

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/issues`,
      body: issueFields,
    });

    return response;
  },
});
