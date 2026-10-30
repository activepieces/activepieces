import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userGroupOutputSchema } from '../../output-schemas';

export const addUserToGroupAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_add_user_to_group',
	outputSchema: userGroupOutputSchema,
	displayName: 'Add User to Group',
	description: 'Adds a workspace member to a user group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds one workspace member to a user group and returns the group with its member IDs. Needs workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userGroupId: clockifyAiProps.userGroupId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.addUserToGroup({
			auth,
			workspaceId: propsValue.workspaceId,
			userGroupId: propsValue.userGroupId,
			userId: propsValue.userId,
		});
	},
});
