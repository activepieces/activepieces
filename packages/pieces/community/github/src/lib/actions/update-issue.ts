import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUpdateIssueAction = createAction({
  auth: githubAuth,
  name: 'update_issue',
  displayName: 'Update Issue',
  description: 'Updates an existing issue.',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: githubCommon.issueDropdown(),
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
      description: 'The new state of the issue.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    state_reason: Property.StaticDropdown({
      displayName: 'State Reason',
      description:
        'The reason for the state change. (Only used if State is changed).',
      required: false,
      options: {
        options: [
          { label: 'Completed', value: 'completed' },
          { label: 'Not Planned', value: 'not_planned' },
          { label: 'Reopened', value: 'reopened' },
          { label: 'Duplicate', value: 'duplicate' },
        ],
      },
    }),
    milestone: githubCommon.milestoneDropdown(false),
    labels: githubCommon.labelDropDown(false),
    assignees: githubCommon.assigneeDropDown(false),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;

    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body.title = propsValue.title;
    if (propsValue.body !== undefined) body.body = propsValue.body;
    if (propsValue.state !== undefined) body.state = propsValue.state;
    if (propsValue.state_reason !== undefined)
      body.state_reason = propsValue.state_reason;
    if (propsValue.assignees !== undefined)
      body.assignees = propsValue.assignees;
    if (propsValue.labels !== undefined) body.labels = propsValue.labels;
    if (propsValue.milestone !== undefined)
      body.milestone = propsValue.milestone;

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}/issues/${propsValue.issue_number}`,
      body: body,
    });

    return response;
  },
});
