import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';

export const deleteWorkspaceFolder = createAction({
	auth: tallyAuth,
	name: 'delete_workspace_folder',
	displayName: 'Delete Workspace Folder',
	description: 'Deletes a folder and its subtree from a workspace (requires Tally Pro).',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Deletes a folder and its subtree from a workspace. Requires Tally Pro. Forms inside the folder are unfoldered (not deleted), but nested sub-folders are removed. Re-invoking on an already-deleted folder is a no-op. Requires both the workspace id (List Workspaces) and the folder id (List Workspace Folders).",
		idempotent: true,
	},
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The workspace containing the folder. Obtain from List Workspaces.',
			required: true,
		}),
		folder_id: Property.ShortText({
			displayName: 'Folder ID',
			description: 'The folder to delete. Obtain from List Workspace Folders.',
			required: true,
		}),
	},
	async run(context) {
		await tallyApiClient.request<void>({
			method: HttpMethod.DELETE,
			path: `/workspaces/${context.propsValue.workspace_id}/folders/${context.propsValue.folder_id}`,
			apiKey: context.auth.secret_text,
		});
		return {
			workspace_id: context.propsValue.workspace_id,
			folder_id: context.propsValue.folder_id,
			deleted: true,
		};
	},
});
