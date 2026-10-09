import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformListWorkspaceUsersOutputSchema } from '../../../output-schemas';

export const opnformListWorkspaceUsersAction = createAction({
	auth: opnformAuth,
	name: 'opnform_list_workspace_users',
	outputSchema: opnformListWorkspaceUsersOutputSchema,
	displayName: 'List Workspace Users',
	description: 'Lists the members of a workspace and their roles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every member of a workspace with their user id, name, email and role. Use it to find the User ID for Remove Workspace User and Update Workspace User Role.',
		idempotent: true,
	},
	props: {
		workspaceId: opnformAiProps.workspaceId({ required: true }),
	},
	async run(context) {
		const users = await opnformApi.listWorkspaceUsers({
			auth: context.auth,
			workspaceId: context.propsValue.workspaceId,
		});
		return { users, count: users.length };
	},
});
