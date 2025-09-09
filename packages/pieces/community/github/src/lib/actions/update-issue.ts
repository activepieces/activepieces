import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon, RepositoryProp } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateIssue = createAction({
  auth: githubAuth,
  name: 'updateIssue',
  displayName: 'Update Issue',
  description: '',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the issue',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body content of the issue',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Change the state of the issue',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    labels: githubCommon.labelDropDown(),
    assignees: githubCommon.assigneeDropDown(),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository as RepositoryProp;

    const body: Record<string, any> = {};
    if (propsValue.title) body.title = propsValue.title;
    if (propsValue.body) body.body = propsValue.body;
    if (propsValue.state) body.state = propsValue.state;
    if (propsValue.assignees && propsValue.assignees.length > 0) {
      body.assignees = propsValue.assignees;
    }
    if (propsValue.labels && propsValue.labels.length > 0) {
      body.labels = propsValue.labels;
    }
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}/issues/${propsValue.issue_number}`,
      body,
    });

    return response.body;
  },
});
