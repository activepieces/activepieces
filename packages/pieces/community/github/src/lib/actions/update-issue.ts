import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUpdateIssueAction = createAction({
  auth: githubAuth,
  name: 'updateIssue',
  displayName: 'Update Issue',
  description: 'Updates fields of an existing issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    labels: githubCommon.labelDropDown(false),
    assignees: githubCommon.assigneeDropDown(false),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const { issue_number, title, body, state, labels, assignees } = propsValue as any;

    const payload: Record<string, any> = {};
    if (title) payload.title = title;
    if (body) payload.body = body;
    if (state) payload.state = state;
    if (labels) payload.labels = labels;
    if (assignees) payload.assignees = assignees;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
      body: payload,
    });

    return response;
  },
});

