import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickDeleteProjectOutputSchema } from '../../output-schemas';

export const deleteProjectAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_delete_project',
	outputSchema: ticktickDeleteProjectOutputSchema,
	displayName: 'Delete Project',
	description: 'Deletes a TickTick project.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a project by projectId from ticktick_list_projects, including the tasks inside it. Confirm the target before calling.',
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
		const { projectId } = context.propsValue;
		await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.DELETE,
			resourceUri: `/project/${projectId}`,
		});
		return { success: true, projectId };
	},
});
