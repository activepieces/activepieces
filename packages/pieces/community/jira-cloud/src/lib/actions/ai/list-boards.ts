import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { boardsOutputSchema } from '../../output-schemas';
export const listBoardsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'list_boards',
	classification: 'SEARCH',
	displayName: 'List Boards',
	description: 'Lists the Scrum and Kanban boards visible to the user.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the Jira Software boards visible to the connected user, optionally filtered by name, type (scrum or kanban) and project, with their numeric board IDs. Board IDs are required by List Sprints and Create Sprint. Requires Jira Software on the site. Read-only.',
		idempotent: true,
	},
	outputSchema: boardsOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only return boards whose name contains this text.',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Board Type',
			required: false,
			options: {
				options: [
					{ label: 'Scrum', value: 'scrum' },
					{ label: 'Kanban', value: 'kanban' },
				],
			},
		}),
		projectKeyOrId: Property.ShortText({
			displayName: 'Project ID or Key',
			description: 'Only return boards that include this project.',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const { body: response } = await httpClient.sendRequest<JiraPageBean<JiraRecord>>({
			method: HttpMethod.GET,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/board`,
			queryParams: {
				startAt: String(propsValue.startAt ?? 0),
				maxResults: String(propsValue.maxResults ?? 50),
				...(jiraAiHelpers.isProvided(propsValue.name) ? { name: propsValue.name } : {}),
				...(jiraAiHelpers.isProvided(propsValue.type) ? { type: propsValue.type } : {}),
				...(jiraAiHelpers.isProvided(propsValue.projectKeyOrId) ? { projectKeyOrId: propsValue.projectKeyOrId.trim() } : {}),
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
