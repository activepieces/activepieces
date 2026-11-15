import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { boardOutputSchema } from '../../output-schemas';
export const createBoardAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'create_board',
	classification: 'WRITE',
	displayName: 'Create Board',
	description: 'Creates a Scrum or Kanban board from a saved filter.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create a Scrum or Kanban board whose issues come from an existing saved filter, optionally placing it in a project. The filter ID comes from Search Filters, and the user must be able to see that filter. Requires Jira Software. Not idempotent: each call creates another board.',
		idempotent: false,
	},
	outputSchema: boardOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Board Type',
			required: true,
			options: {
				options: [
					{ label: 'Scrum', value: 'scrum' },
					{ label: 'Kanban', value: 'kanban' },
				],
			},
		}),
		filterId: Property.Number({
			displayName: 'Filter ID',
			description: 'ID of the saved filter that selects the board issues. Find it with Search Filters.',
			required: true,
		}),
		projectKeyOrId: Property.ShortText({
			displayName: 'Project ID or Key',
			description: 'Project to place the board in. Leave empty to create it in the user profile.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await httpClient.sendRequest<JiraRecord>({
			method: HttpMethod.POST,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/board`,
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
			body: {
				name: propsValue.name,
				type: propsValue.type,
				filterId: propsValue.filterId,
				...(jiraAiHelpers.isProvided(propsValue.projectKeyOrId)
					? { location: { type: 'project', projectKeyOrId: propsValue.projectKeyOrId.trim() } }
					: {}),
			},
		});
		return response.body;
	},
});
