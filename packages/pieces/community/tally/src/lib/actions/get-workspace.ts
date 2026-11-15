import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { workspacesDropdown } from '../common/props';
import { getWorkspaceActionOutputSchema } from '../output-schemas';

export const getWorkspaceAction = createAction({
	auth: tallyAuth,
	name: 'get_workspace',
	classification: 'READ',
	displayName: 'Get Workspace',
	description: 'Get a single workspace by id',
	audience: 'ai',
	outputSchema: getWorkspaceActionOutputSchema,
	aiMetadata: {
		description:
			'Fetches one workspace by id with its members, pending invites, and folders. Use List Workspaces first to resolve a workspace id. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		workspace_id: workspacesDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.getWorkspace({ apiKey: auth.secret_text, workspaceId: propsValue.workspace_id });
	},
});
