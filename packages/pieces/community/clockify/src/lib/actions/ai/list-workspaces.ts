import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyApi } from '../../common/api';
import { workspacesOutputSchema } from '../../output-schemas';

const ROLE_OPTIONS = [
	{ label: 'Owner', value: 'OWNER' },
	{ label: 'Workspace Admin', value: 'WORKSPACE_ADMIN' },
	{ label: 'Team Manager', value: 'TEAM_MANAGER' },
	{ label: 'Project Manager', value: 'PROJECT_MANAGER' },
];

export const listWorkspacesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_workspaces',
	outputSchema: workspacesOutputSchema,
	displayName: 'List Workspaces',
	description: 'Lists the workspaces you belong to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every Clockify workspace the connected user belongs to, with id, name, rates and settings. Call this first to get the workspace ID that every other Clockify action needs. Optionally keep only workspaces where the user has a given role.',
		idempotent: true,
	},
	props: {
		role: Property.StaticDropdown({
			displayName: 'Role',
			description: 'Optional: only workspaces where the connected user has this role.',
			required: false,
			options: { disabled: false, options: ROLE_OPTIONS },
		}),
	},
	async run({ auth, propsValue }) {
		const workspaces = await clockifyApi.listWorkspaces({
			auth,
			query: propsValue.role ? { roles: propsValue.role } : {},
		});
		return { workspaces, count: workspaces.length };
	},
});
