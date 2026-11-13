import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateColumnOutputSchema } from '../../output-schemas';

export const createColumnAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_column',
	outputSchema: ticktickCreateColumnOutputSchema,
	displayName: 'Create Column',
	description: 'Creates a kanban column in a TickTick project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a column to a kanban project and returns it with its id. Kanban projects only. Not idempotent, and the API has no delete-column endpoint, so check ticktick_list_columns first.',
		idempotent: false,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The kanban project ID, from the List Projects action.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The column name (max 1000 characters).',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, name } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}/column`,
			body: { name },
		});
	},
});
