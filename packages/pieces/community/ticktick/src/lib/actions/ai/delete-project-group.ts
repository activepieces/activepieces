import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickDeleteProjectGroupOutputSchema } from '../../output-schemas';

export const deleteProjectGroupAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_delete_project_group',
	outputSchema: ticktickDeleteProjectGroupOutputSchema,
	displayName: 'Delete Project Group',
	description: 'Deletes a project group.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a project group by projectGroupId from ticktick_list_project_groups. Confirm the target before calling.',
		idempotent: true,
	},
	props: {
		projectGroupId: Property.ShortText({
			displayName: 'Project Group ID',
			description: 'The group ID, from the List Project Groups action.',
			required: true,
		}),
	},
	async run(context) {
		const { projectGroupId } = context.propsValue;
		await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.DELETE,
			resourceUri: `/project/group/${projectGroupId}`,
		});
		return { success: true, projectGroupId };
	},
});
