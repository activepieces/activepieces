import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { workspacesDropdown } from '../common/props';

export const listWorkspaceFoldersAction = createAction({
	auth: tallyAuth,
	name: 'list_workspace_folders',
	classification: 'SEARCH',
	displayName: 'List Workspace Folders',
	description: 'List folders inside a workspace',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the folders inside a workspace, including nested folders (via each folder\'s parentId). Use to resolve a folder id before calling Create Form, Rename Folder, or Delete Folder. Requires the workspace to be on a Pro (or higher) plan. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		workspace_id: workspacesDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.listWorkspaceFolders({
			apiKey: auth.secret_text,
			workspaceId: propsValue.workspace_id,
		});
	},
});
