import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userGroupOutputSchema } from '../../output-schemas';

export const removeUserFromGroupAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_remove_user_from_group',
	outputSchema: userGroupOutputSchema,
	displayName: 'Remove User from Group',
	description: 'Removes a member from a user group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes one member from a user group (they stay in the workspace) and returns the group. Needs workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userGroupId: clockifyAiProps.userGroupId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.removeUserFromGroup({
			auth,
			workspaceId: propsValue.workspaceId,
			userGroupId: propsValue.userGroupId,
			userId: propsValue.userId,
		});
	},
});
