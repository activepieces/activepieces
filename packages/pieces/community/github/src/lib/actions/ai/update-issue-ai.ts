import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUpdateIssueAiAction = createAction({
  auth: githubAuth,
  name: 'update_issue_ai',
  displayName: 'Update Issue (Agent)',
  description: 'Edits an existing issue, including closing or reopening it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits an existing issue (PATCH /repos/{owner}/{repo}/issues/{issue_number}), setting only the fields you provide — title, body, state (open/closed) with state_reason, milestone (set Clear Milestone to remove it), labels, or assignees. Use to modify, close, or reopen an issue (no separate close action). Labels and assignees here REPLACE the existing set; use Add Labels to Issue / Add Assignees to Issue to append. Idempotent: applying the same field values again leaves the issue in the same state.',
    idempotent: true,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description:
        'Repository owner login (user or org). Resolve via List My Repositories or Search Repositories.',
      required: true,
    }),
    repo: Property.ShortText({
      displayName: 'Repository',
      description: 'Repository name (without the owner prefix).',
      required: true,
    }),
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description:
        'The issue number to update. Resolve via List Repository Issues.',
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
      description: 'The new state of the issue (open or closed).',
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
        'The reason for the state change (only used if State is set).',
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
    milestone: Property.Number({
      displayName: 'Milestone Number',
      description:
        "Milestone number to associate. Resolve via List Milestones. To remove the issue's milestone instead, set Clear Milestone.",
      required: false,
    }),
    clear_milestone: Property.Checkbox({
      displayName: 'Clear Milestone',
      description:
        "Set to true to remove the issue's current milestone. Overrides Milestone Number.",
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description:
        'Replaces the full label set. Resolve names via List Repository Labels.',
      required: false,
    }),
    assignees: Property.Array({
      displayName: 'Assignees',
      description:
        'Replaces the full assignee set (logins). Resolve via List Assignees.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number } = propsValue;

    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body['title'] = propsValue.title;
    if (propsValue.body !== undefined) body['body'] = propsValue.body;
    if (propsValue.state !== undefined) body['state'] = propsValue.state;
    if (propsValue.state_reason !== undefined)
      body['state_reason'] = propsValue.state_reason;
    if (propsValue.clear_milestone) {
      body['milestone'] = null;
    } else if (propsValue.milestone !== undefined) {
      body['milestone'] = propsValue.milestone;
    }
    if (propsValue.labels !== undefined)
      body['labels'] = propsValue.labels as string[];
    if (propsValue.assignees !== undefined)
      body['assignees'] = propsValue.assignees as string[];

    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PATCH,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Issue #${issue_number} not found in ${owner}/${repo}.`
        );
      if (status === 403)
        throw new Error('Permission denied updating the issue.');
      throw error;
    }
  },
});
