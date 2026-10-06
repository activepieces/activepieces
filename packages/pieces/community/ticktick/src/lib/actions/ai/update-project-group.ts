import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickUpdateProjectGroupOutputSchema } from '../../output-schemas';

export const updateProjectGroupAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_update_project_group',
	outputSchema: ticktickUpdateProjectGroupOutputSchema,
	displayName: 'Update Project Group',
	description: 'Renames a project group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a project group by projectGroupId from ticktick_list_project_groups. Sets state, so repeating it is safe.',
		idempotent: true,
	},
	props: {
		projectGroupId: Property.ShortText({
			displayName: 'Project Group ID',
			description: 'The group ID, from the List Project Groups action.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new group name (max 64 characters).',
			required: true,
		}),
	},
	async run(context) {
		const { projectGroupId, name } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/group/${projectGroupId}`,
			body: { name },
		});
	},
});
