import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformApi } from '../../../common/api';
import { opnformListWorkspacesOutputSchema } from '../../../output-schemas';

export const opnformListWorkspacesAction = createAction({
	auth: opnformAuth,
	name: 'opnform_list_workspaces',
	outputSchema: opnformListWorkspacesOutputSchema,
	displayName: 'List Workspaces',
	description: 'Lists the workspaces the connected user belongs to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every workspace the connected user belongs to, with its numeric id and name. Use it to find the Workspace ID other actions need.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const workspaces = await opnformApi.listWorkspaces({ auth: context.auth });
		return { workspaces, count: workspaces.length };
	},
});
