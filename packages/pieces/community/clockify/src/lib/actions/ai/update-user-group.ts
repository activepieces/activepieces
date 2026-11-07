import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userGroupOutputSchema } from '../../output-schemas';

export const updateUserGroupAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_user_group',
	outputSchema: userGroupOutputSchema,
	displayName: 'Update User Group',
	description: 'Renames a user group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a user group (the name is its only editable field; members are changed with Add User to Group and Remove User from Group). Needs workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userGroupId: clockifyAiProps.userGroupId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name of the group.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateUserGroup({
			auth,
			workspaceId: propsValue.workspaceId,
			userGroupId: propsValue.userGroupId,
			name: propsValue.name,
		});
	},
});
