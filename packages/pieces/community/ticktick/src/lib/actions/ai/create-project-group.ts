import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateProjectGroupOutputSchema } from '../../output-schemas';

export const createProjectGroupAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_project_group',
	outputSchema: ticktickCreateProjectGroupOutputSchema,
	displayName: 'Create Project Group',
	description: 'Creates a new project group (folder).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a project group and returns it with its id. Not idempotent: check ticktick_list_project_groups first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The group name (max 64 characters).',
			required: true,
		}),
	},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/project/group',
			body: { name: context.propsValue.name },
		});
	},
});
