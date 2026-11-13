import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListWorkspacesOutputSchema } from '../../output-schemas';

export const zohoBookingsListWorkspacesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_workspaces',
	outputSchema: zohoBookingsListWorkspacesOutputSchema,
	displayName: 'List Workspaces',
	description: 'List the workspaces in the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List every workspace in the Zoho Bookings account with its ID and name, or get one workspace by ID. Workspace IDs are needed by List Services, Create Service and Create Resource.',
		idempotent: true,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({
			required: false,
			description: 'Return only this workspace. Leave empty to list all.',
		}),
	},
	async run({ auth, propsValue }) {
		const workspaces = await zohoBookingsApi.listWorkspaces({
			auth,
			workspaceId: propsValue.workspaceId,
		});
		return { workspaces, count: workspaces.length };
	},
});
