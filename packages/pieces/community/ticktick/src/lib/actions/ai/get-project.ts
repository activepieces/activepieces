import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateProjectOutputSchema } from '../../output-schemas';

export const getProjectAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_project',
	outputSchema: ticktickCreateProjectOutputSchema,
	displayName: 'Get Project',
	description: 'Retrieves the details of a TickTick project by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one project\'s metadata (name, color, view mode, group, permission, kind) by projectId from ticktick_list_projects. Use ticktick_get_project_data instead when you also need its tasks. Read-only.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project ID, from the List Projects action.',
			required: true,
		}),
	},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${context.propsValue.projectId}`,
		});
	},
});
