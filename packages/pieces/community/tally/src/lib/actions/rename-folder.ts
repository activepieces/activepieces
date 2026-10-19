import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { requiredFoldersDropdown, workspacesDropdown } from '../common/props';

export const renameFolderAction = createAction({
	auth: tallyAuth,
	name: 'rename_folder',
	classification: 'WRITE',
	displayName: 'Rename Folder',
	description: 'Rename a folder',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renames a folder to the given name. Requires a Pro (or higher) plan. Repeating the same call converges on the same state, so it is idempotent.',
		idempotent: true,
	},
	props: {
		workspace_id: workspacesDropdown,
		folder_id: requiredFoldersDropdown,
		name: Property.ShortText({
			displayName: 'New Name',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.renameFolder({
			apiKey: auth.secret_text,
			workspaceId: propsValue.workspace_id,
			folderId: propsValue.folder_id,
			name: propsValue.name,
		});
		return { workspaceId: propsValue.workspace_id, folderId: propsValue.folder_id, name: propsValue.name };
	},
});
