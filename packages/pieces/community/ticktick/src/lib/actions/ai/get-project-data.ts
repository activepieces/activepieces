import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickGetProjectDataOutputSchema } from '../../output-schemas';

export const getProjectDataAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_project_data',
	outputSchema: ticktickGetProjectDataOutputSchema,
	displayName: 'Get Project With Tasks',
	description: 'Retrieves a TickTick project together with its incomplete tasks and kanban columns.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns { project, tasks, columns } for a projectId from ticktick_list_projects. Only incomplete tasks are included; use ticktick_list_completed_tasks for finished ones. Columns are present for kanban projects only. Read-only.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project ID, from the List Projects action. Use "inbox" for the Inbox.',
			required: true,
		}),
	},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${context.propsValue.projectId}/data`,
		});
	},
});
