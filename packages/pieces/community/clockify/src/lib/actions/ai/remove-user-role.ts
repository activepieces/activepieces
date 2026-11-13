import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { removedUserRoleOutputSchema } from '../../output-schemas';

export const removeUserRoleAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_remove_user_role',
	outputSchema: removedUserRoleOutputSchema,
	displayName: 'Remove User Role',
	description: 'Removes an admin or manager role from a user.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes a Workspace Admin, Team Manager or Project Manager role from a workspace member, for the same Entity ID it was given on. Removing Workspace Admin takes away their control of the workspace. Needs workspace admin.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		role: Property.StaticDropdown({
			displayName: 'Role',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Workspace Admin', value: 'WORKSPACE_ADMIN' },
					{ label: 'Team Manager', value: 'TEAM_MANAGER' },
					{ label: 'Project Manager', value: 'PROJECT_MANAGER' },
				],
			},
		}),
		entityId: Property.ShortText({
			displayName: 'Entity ID',
			description:
				'What the role applies to. Workspace Admin: the workspace ID. Team Manager: the ID of the user (or user group) to manage. Project Manager: the project ID.',
			required: true,
		}),
		entityIsUserGroup: Property.Checkbox({
			displayName: 'Entity Is a User Group',
			description:
				'Team Manager only: set when Entity ID is a user group ID rather than a user ID. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		await clockifyApi.removeUserRole({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			role: propsValue.role,
			entityId: propsValue.entityId,
			sourceType: propsValue.entityIsUserGroup ? 'USER_GROUP' : undefined,
		});
		return {
			removed: true,
			userId: propsValue.userId,
			role: propsValue.role,
			entityId: propsValue.entityId,
		};
	},
});
