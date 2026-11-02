import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { userGroupOutputSchema } from '../../output-schemas';

export const createUserGroupAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_user_group',
	outputSchema: userGroupOutputSchema,
	displayName: 'Create User Group',
	description: 'Creates a user group in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an empty user group (team) in a Clockify workspace and returns it with its ID. Add members with Add User to Group. Needs workspace admin. Not idempotent: names must be unique, so a repeat fails.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the group, unique in the workspace.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createUserGroup({
			auth,
			workspaceId: propsValue.workspaceId,
			name: propsValue.name,
		});
	},
});
