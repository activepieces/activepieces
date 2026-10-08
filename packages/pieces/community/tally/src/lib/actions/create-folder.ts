import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { foldersDropdown, workspacesDropdown } from '../common/props';

export const createFolderAction = createAction({
	auth: tallyAuth,
	name: 'create_folder',
	classification: 'WRITE',
	displayName: 'Create Folder',
	description: 'Create a folder inside a workspace',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a folder inside a workspace, optionally nested under a parent folder. Requires a Pro (or higher) plan. Each call creates a new folder, so it is not idempotent (retries duplicate).',
		idempotent: false,
	},
	props: {
		workspace_id: workspacesDropdown,
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		parent_id: foldersDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.createFolder({
			apiKey: auth.secret_text,
			workspaceId: propsValue.workspace_id,
			name: propsValue.name,
			parentId: propsValue.parent_id,
		});
	},
});
