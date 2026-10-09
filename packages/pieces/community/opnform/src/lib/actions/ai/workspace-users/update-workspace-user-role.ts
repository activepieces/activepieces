import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformUpdateWorkspaceUserRoleOutputSchema } from '../../../output-schemas';

export const opnformUpdateWorkspaceUserRoleAction = createAction({
	auth: opnformAuth,
	name: 'opnform_update_workspace_user_role',
	outputSchema: opnformUpdateWorkspaceUserRoleOutputSchema,
	displayName: 'Update Workspace User Role',
	description: "Changes a workspace member's role.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets a workspace member's role to admin, user or readonly. Requires workspace admin.",
		idempotent: true,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
		userId: Property.ShortText({
			displayName: 'User ID',
			description: 'Numeric user ID of the member, from List Workspace Users.',
			required: true,
		}),
		role: opnformAiProps.role({ required: true }),
	},
	async run(context) {
		const { workspaceId, userId, role } = context.propsValue;
		return await opnformApi.updateWorkspaceUserRole({
			auth: context.auth,
			workspaceId,
			userId,
			role,
		});
	},
});
