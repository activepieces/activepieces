import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userGroupOutputSchema } from '../../output-schemas';

export const deleteUserGroupAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_user_group',
	outputSchema: userGroupOutputSchema,
	displayName: 'Delete User Group',
	description: 'Deletes a user group.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a user group. Its members stay in the workspace; only the grouping and its project memberships go. Needs workspace admin.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userGroupId: clockifyAiProps.userGroupId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteUserGroup({
			auth,
			workspaceId: propsValue.workspaceId,
			userGroupId: propsValue.userGroupId,
		});
	},
});
