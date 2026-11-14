import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, isNil } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from '../common';
import { waitingPlaceholder } from '../common/placeholders';
import { getIssueIdDropdown, getProjectIdDropdown, issueStatusIdProp } from '../common/props';
import { jiraTransitions } from '../common/transitions';
import { issueOutputSchema } from '../output-schemas';

export const transitionIssueAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'transition_issue',
	classification: 'WRITE',
	displayName: 'Transition Issue',
	description: 'Moves an issue to another status, such as resolving it.',
	audience: 'both',
	aiMetadata: {
		description:
			'Run a workflow transition on a Jira Data Center/Server issue (for example start progress, resolve or close) and return the issue with its new status. Pass the transition by ID or name; it must be available from the current status, so running it a second time fails. Transitions that close the issue usually need a resolution (ID or name). An optional comment is added to the issue after the move. Prefer this over Update Issue whenever the move needs a resolution or a comment.',
		idempotent: false,
	},
	outputSchema: issueOutputSchema,
	propertyGroups: [
		{
			key: 'issue',
			display: 'section',
			label: 'Issue',
			icon: 'inbox',
			props: ['projectId', 'issueId'],
		},
		{
			key: 'workflow',
			display: 'section',
			label: 'Workflow',
			icon: 'send',
			props: ['transitionId', 'resolution'],
		},
	],
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		transitionId: {
			...issueStatusIdProp('Transition', true),
			description: 'Moves the issue to the chosen status.',
		},
		resolution: Property.Dropdown({
			auth: jiraDataCenterAuth,
			displayName: 'Resolution',
			description: 'Needed when the transition closes the issue.',
			required: false,
			refreshers: ['issueId', 'transitionId'],
			options: async ({ auth, issueId, transitionId }) => {
				const issue = asText(issueId);
				const wanted = asText(transitionId);
				if (!auth || isNil(issue) || isNil(wanted)) {
					return {
						disabled: true,
						options: [],
						placeholder: waitingPlaceholder({ auth, waitingFor: 'Select a transition first' }),
					};
				}
				const transitions = await jiraTransitions.list({ auth, issueId: issue });
				const resolutions = jiraTransitions.resolutionsOf(
					jiraTransitions.find({ transitions, idOrName: wanted }),
				);
				if (resolutions.length === 0) {
					return {
						disabled: true,
						options: [],
						placeholder: 'This transition takes no resolution',
					};
				}
				return {
					disabled: false,
					options: resolutions.map((resolution) => ({
						label: resolution.name ?? resolution.id,
						value: resolution.id,
					})),
				};
			},
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Added to the issue after the transition.',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const issueId = asText(context.propsValue.issueId);
		const transitionIdOrName = asText(context.propsValue.transitionId);
		if (isNil(issueId) || isNil(transitionIdOrName)) {
			throw new Error('Issue and Transition are required');
		}

		const { transition, resolution } = jiraTransitions.resolve({
			transitions: await jiraTransitions.list({ auth: context.auth, issueId }),
			transitionIdOrName,
			resolutionIdOrName: asText(context.propsValue.resolution),
			issueId,
		});

		await jiraApiCall({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(issueId)}/transitions`,
			body: {
				transition: { id: transition.id },
				...(isNil(resolution) ? {} : { fields: { resolution: { id: resolution.id } } }),
			},
		});

		const comment = asText(context.propsValue.comment);
		if (!isNil(comment)) {
			await jiraApiCall({
				auth: context.auth,
				method: HttpMethod.POST,
				resourceUri: `/issue/${encodeURIComponent(issueId)}/comment`,
				body: { body: comment },
			});
		}

		return await jiraApiCall<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(issueId)}`,
		});
	},
});

function asText(value: unknown): string | undefined {
	if (typeof value === 'number') {
		return String(value);
	}
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
