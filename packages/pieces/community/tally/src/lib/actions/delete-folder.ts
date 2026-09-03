import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { requiredFoldersDropdown, workspacesDropdown } from '../common/props';

export const deleteFolderAction = createAction({
	auth: tallyAuth,
	name: 'delete_folder',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Folder',
	description: 'Delete a folder and its subtree, moving contained forms to trash',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes a folder and its entire subtree of nested folders. Forms inside are moved to trash, not permanently deleted — recoverable from Tally\'s trash within its retention window. Requires a Pro (or higher) plan. A repeat call errors once the folder is gone, so this is not idempotent.',
		idempotent: false,
	},
	props: {
		workspace_id: workspacesDropdown,
		folder_id: requiredFoldersDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.deleteFolder({
			apiKey: auth.secret_text,
			workspaceId: propsValue.workspace_id,
			folderId: propsValue.folder_id,
		});
		return { workspaceId: propsValue.workspace_id, folderId: propsValue.folder_id, deleted: true };
	},
});
