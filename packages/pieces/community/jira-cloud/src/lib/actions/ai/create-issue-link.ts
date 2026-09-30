import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { createIssueLinkOutputSchema } from '../../output-schemas';
export const createIssueLinkAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'create_issue_link',
	classification: 'WRITE',
	displayName: 'Create Issue Link',
	description: 'Links two issues with a link type.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Link two issues with a named link type such as Blocks, Relates or Duplicates, with an optional comment on the inward issue. Direction matters: the outward issue gets the outward wording (e.g. "blocks") and the inward issue the inward wording (e.g. "is blocked by"); get valid names and wording from Get Issue Link Types. Not idempotent: Jira may add a duplicate link.',
		idempotent: false,
	},
	outputSchema: createIssueLinkOutputSchema,
	props: {
		linkTypeName: Property.ShortText({
			displayName: 'Link Type Name',
			description: 'Name of the link type, e.g. Blocks. Find it with Get Issue Link Types.',
			required: true,
		}),
		outwardIssueKey: jiraAiProps.issueIdOrKey({
			displayName: 'Outward Issue Key',
			description: 'The issue on the outward side, e.g. the issue that blocks the other one.',
		}),
		inwardIssueKey: jiraAiProps.issueIdOrKey({
			displayName: 'Inward Issue Key',
			description: 'The issue on the inward side, e.g. the issue that is blocked.',
		}),
		comment: jiraAiProps.optionalMarkdownText({ displayName: 'Comment', description: 'Optional comment added to the inward issue.' }),
	},
	async run({ auth, propsValue }) {
		const outwardIssueKey = propsValue.outwardIssueKey.trim();
		const inwardIssueKey = propsValue.inwardIssueKey.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/issueLink',
			body: {
				type: { name: propsValue.linkTypeName.trim() },
				outwardIssue: { key: outwardIssueKey },
				inwardIssue: { key: inwardIssueKey },
				...(jiraAiHelpers.isProvided(propsValue.comment)
					? { comment: { body: jiraAiHelpers.markdownToAdf({ markdown: propsValue.comment }) } }
					: {}),
			},
		});
		return {
			success: true,
			link_type: propsValue.linkTypeName.trim(),
			outward_issue: outwardIssueKey,
			inward_issue: inwardIssueKey,
		};
	},
});
