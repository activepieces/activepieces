import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { transitionIssueStatusOutputSchema } from '../../output-schemas';
export const transitionIssueStatusAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'transition_issue_status',
	classification: 'WRITE',
	displayName: 'Transition Issue Status',
	description: 'Moves an issue through a workflow transition.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Move an issue to a new status by performing a workflow transition, optionally setting a resolution, other screen fields and a comment. Needs the numeric transition ID from Get Issue Transitions, which also shows the fields a transition requires. Not idempotent: once moved, the same transition is usually no longer available.',
		idempotent: false,
	},
	outputSchema: transitionIssueStatusOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		transitionId: Property.ShortText({
			displayName: 'Transition ID',
			description: 'The numeric transition ID. Find it with Get Issue Transitions.',
			required: true,
		}),
		resolutionId: Property.ShortText({
			displayName: 'Resolution ID',
			description: 'Resolution to set when the transition screen asks for one. Find it with Get Issue Resolutions.',
			required: false,
		}),
		comment: jiraAiProps.optionalMarkdownText({ displayName: 'Comment', description: 'Optional comment added with the transition.' }),
		fields: Property.Json({
			displayName: 'Additional Fields',
			description: 'JSON object of other transition screen field IDs to values, e.g. {"customfield_10020": "value"}.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const fields = {
			...(jiraAiHelpers.isProvided(propsValue.resolutionId) ? { resolution: { id: propsValue.resolutionId.trim() } } : {}),
			...(jiraAiHelpers.toRecord({ value: propsValue.fields, label: 'Additional Fields' }) ?? {}),
		};
		await jiraApiCall({
			auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/transitions`,
			body: {
				transition: { id: propsValue.transitionId.trim() },
				...(Object.keys(fields).length > 0 ? { fields } : {}),
				...(jiraAiHelpers.isProvided(propsValue.comment)
					? { update: { comment: [{ add: { body: jiraAiHelpers.markdownToAdf({ markdown: propsValue.comment }) } }] } }
					: {}),
			},
		});
		const issue = await jiraApiCall<{ key?: string; fields?: { status?: JiraRecord } }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}`,
			query: { fields: 'status' },
		});
		return {
			success: true,
			issue: issue.key ?? issueIdOrKey,
			transition_id: propsValue.transitionId.trim(),
			status: issue.fields?.status ?? null,
		};
	},
});
