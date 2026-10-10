import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListColumnsOutputSchema } from '../../output-schemas';

export const listColumnsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_columns',
	outputSchema: ticktickListColumnsOutputSchema,
	displayName: 'List Columns',
	description: 'Lists the kanban columns of a TickTick project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists a kanban project\'s columns with their ids and names. Only meaningful for projects with viewMode "kanban". Use to get the columnId for ticktick_update_column. Read-only.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The kanban project ID, from the List Projects action.',
			required: true,
		}),
	},
	async run(context) {
		const columns = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${context.propsValue.projectId}/column`,
		});
		return { columns, count: columns.length };
	},
});
