import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { listWorkspacesActionOutputSchema } from '../output-schemas';

export const listWorkspacesAction = createAction({
	auth: tallyAuth,
	name: 'list_workspaces',
	classification: 'SEARCH',
	displayName: 'List Workspaces',
	description: 'List all workspaces in your Tally account',
	audience: 'ai',
	outputSchema: listWorkspacesActionOutputSchema,
	aiMetadata: {
		description:
			'Lists workspaces with their ids, names, members, pending invites, and folders. Use to resolve a workspace id before calling Create Form, Create Workspace-scoped Folder, or other workspace/folder atomics. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.listWorkspaces({ apiKey: auth.secret_text, page: propsValue.page });
	},
});
