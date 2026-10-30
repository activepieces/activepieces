import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateColumnOutputSchema } from '../../output-schemas';

export const updateColumnAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_update_column',
	outputSchema: ticktickCreateColumnOutputSchema,
	displayName: 'Update Column',
	description: 'Renames a kanban column.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a kanban column by columnId from ticktick_list_columns. Sets state, so repeating it is safe.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The kanban project ID, from the List Projects action.',
			required: true,
		}),
		columnId: Property.ShortText({
			displayName: 'Column ID',
			description: 'The column ID, from the List Columns action.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new column name (max 1000 characters).',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, columnId, name } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}/column/${columnId}`,
			body: { name },
		});
	},
});
