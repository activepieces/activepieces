import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUpdateIssue = createAction({
  auth: githubAuth,
  name: 'updateIssue',
  displayName: 'Update Issue',
  description: 'Update an existing issue in a repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The new title for the issue (optional)',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The new body/description for the issue (optional)',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'The new state for the issue (optional)',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Replace all labels for this issue (optional)',
      required: false,
    }),
    assignees: Property.Array({
      displayName: 'Assignees',
      description: 'Replace all assignees for this issue (optional)',
      required: false,
    }),
    milestone: Property.ShortText({
      displayName: 'Milestone',
      description: 'The number of the milestone to associate this issue with (optional). Use empty string to remove current milestone.',
      required: false,
    }),
    state_reason: Property.StaticDropdown({
      displayName: 'State Reason',
      description: 'The reason for the state change (optional). Only applies when state is changed.',
      required: false,
      options: {
        options: [
          { label: 'Completed', value: 'completed' },
          { label: 'Not Planned', value: 'not_planned' },
          { label: 'Duplicate', value: 'duplicate' },
          { label: 'Reopened', value: 'reopened' },
        ],
      },
    }),
    type: Property.ShortText({
      displayName: 'Issue Type',
      description: 'The name of the issue type to associate with this issue (optional). Use empty string to remove current type.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;

    const updateData: Record<string, any> = {};

    // Only include fields that were provided
    if (propsValue.title !== undefined && propsValue.title !== '') {
      updateData.title = propsValue.title;
    }

    if (propsValue.body !== undefined && propsValue.body !== '') {
      updateData.body = propsValue.body;
    }

    if (propsValue.state !== undefined) {
      updateData.state = propsValue.state;
    }

    if (propsValue.labels !== undefined && Array.isArray(propsValue.labels)) {
      updateData.labels = propsValue.labels;
    }

    if (propsValue.assignees !== undefined && Array.isArray(propsValue.assignees)) {
      updateData.assignees = propsValue.assignees;
    }

    if (propsValue.milestone !== undefined && propsValue.milestone !== '') {
      // Convert string to number if it's a valid number, otherwise use as string
      const milestoneValue = /^\d+$/.test(propsValue.milestone)
        ? parseInt(propsValue.milestone, 10)
        : propsValue.milestone;
      updateData.milestone = milestoneValue;
    } else if (propsValue.milestone === '') {
      // Empty string means remove milestone
      updateData.milestone = null;
    }

    if (propsValue.state_reason !== undefined && propsValue.state !== undefined) {
      updateData.state_reason = propsValue.state_reason;
    }

    if (propsValue.type !== undefined && propsValue.type !== '') {
      updateData.type = propsValue.type;
    } else if (propsValue.type === '') {
      // Empty string means remove type
      updateData.type = null;
    }

    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
      body: updateData,
    });

    return response;
  },
});
