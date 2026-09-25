import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { sprintsOutputSchema } from '../../output-schemas';
export const listSprintsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_sprints',
	classification: 'SEARCH',
	displayName: 'List Sprints',
	description: 'Lists the sprints of a Scrum board.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the sprints of one Scrum board, optionally filtered by state (future, active, closed), with their numeric IDs, dates and goals. Use it to find the sprint ID for Move Issues to Sprint; Kanban boards have no sprints and return an error. Board IDs come from List Boards. Read-only.',
		idempotent: true,
	},
	outputSchema: sprintsOutputSchema,
	props: {
		boardId: Property.Number({
			displayName: 'Board ID',
			description: 'The numeric board ID. Find it with List Boards.',
			required: true,
		}),
		state: Property.StaticMultiSelectDropdown({
			displayName: 'State',
			required: false,
			options: {
				options: [
					{ label: 'Future', value: 'future' },
					{ label: 'Active', value: 'active' },
					{ label: 'Closed', value: 'closed' },
				],
			},
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const state = propsValue.state ?? [];
		const { body: response } = await httpClient.sendRequest<JiraPageBean<JiraRecord>>({
			method: HttpMethod.GET,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/board/${propsValue.boardId}/sprint`,
			queryParams: {
				startAt: String(propsValue.startAt ?? 0),
				maxResults: String(propsValue.maxResults ?? 50),
				...(state.length > 0 ? { state: state.join(',') } : {}),
			},
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
		});
		return jiraAiHelpers.toPage({
			items: response.values ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
			isLast: response.isLast,
		});
	},
});
