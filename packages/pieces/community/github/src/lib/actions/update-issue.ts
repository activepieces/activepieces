import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { issueActionOutputSchema } from '../output-schemas';

export const githubUpdateIssueAction = createAction({
  auth: githubAuth,
  name: 'update_issue',
  classification: 'WRITE',
  displayName: 'Update Issue',
  description:
    "Changes an issue's text, state, milestone, labels or assignees.",
  audience: 'human',
  aiMetadata: {
    description:
      'Edits an existing issue (by number) in a repository, setting only the fields you provide — title, body, state (open/closed) and state reason, milestone, labels, or assignees. Use to modify, close, or reopen an issue. Idempotent: applying the same field values again leaves the issue in the same state. Note that labels and assignees here replace the existing set rather than append.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'issue',
      display: 'section',
      label: 'Issue to update',
      icon: 'inbox',
      props: ['repository', 'issue_number'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: [
        'changesNote',
        'title',
        'body',
        'state',
        'state_reason',
        'milestone',
        'labels',
        'assignees',
      ],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: githubCommon.issueDropdown(),
    changesNote: Property.MarkDown({
      value:
        'Fields left empty keep their current value. Labels and assignees you pick replace the current ones.',
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Description',
      description: 'Markdown is supported.',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      width: 'half',
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
        'Why the issue was closed or reopened. Ignored unless State changes.',
      required: false,
      width: 'half',
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
  outputSchema: issueActionOutputSchema,
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;

    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body.title = propsValue.title;
    if (propsValue.body !== undefined) body.body = propsValue.body;
    if (propsValue.state !== undefined) body.state = propsValue.state;
    if (propsValue.state_reason !== undefined)
      body.state_reason = propsValue.state_reason;
    if (propsValue.assignees !== undefined && propsValue.assignees.length > 0)
      body.assignees = propsValue.assignees;
    if (propsValue.labels !== undefined && propsValue.labels.length > 0)
      body.labels = propsValue.labels;
    if (propsValue.milestone !== undefined)
      body.milestone = propsValue.milestone;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.PATCH,
      resourceUri: `/repos/${owner}/${repo}/issues/${propsValue.issue_number}`,
      body: body,
    });

    return response;
  },
});
