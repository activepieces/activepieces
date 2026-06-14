import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const linkIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'link_issues',
  displayName: 'Link Issues',
  description: 'Creates a relationship between two issues (e.g. "relates to", "depends on", "is duplicated by").',
  audience: 'both',
  aiMetadata: { description: 'Create a directional relationship between two issues, given the source issue ID, the readable target issue ID (e.g. "NP-92"), and a link type (relates to, depends on, duplicates, parent for, subtask of, etc.). Idempotent: re-creating an existing link of the same type leaves the relationship unchanged.', idempotent: true },
  props: {
    sourceIssue: issueDropdown,
    targetIssueId: Property.ShortText({
      displayName: 'Target Issue ID',
      description: 'The readable ID of the issue to link to (e.g. "NP-92"). You can find this in the issue URL or header.',
      required: true,
    }),
    linkType: Property.StaticDropdown({
      displayName: 'Link Type',
      description: 'The type of relationship between the issues.',
      required: true,
      defaultValue: 'relates to',
      options: {
        options: [
          { label: 'Relates to', value: 'relates to' },
          { label: 'Depends on', value: 'depends on' },
          { label: 'Is duplicated by', value: 'is duplicated by' },
          { label: 'Duplicates', value: 'duplicates' },
          { label: 'Parent for', value: 'parent for' },
          { label: 'Subtask of', value: 'subtask of' },
        ],
      },
    }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const body: Record<string, unknown> = {
      query: context.propsValue.linkType + ' ' + context.propsValue.targetIssueId,
      issues: [{ id: context.propsValue.sourceIssue }],
    };
    await youtrackApiCall({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/commands',
      body,
    });
    return { success: true, link_type: context.propsValue.linkType, target_issue: context.propsValue.targetIssueId };
  },
});
