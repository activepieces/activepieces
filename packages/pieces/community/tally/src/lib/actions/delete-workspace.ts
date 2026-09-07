import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { workspacesDropdown } from '../common/props';

export const deleteWorkspaceAction = createAction({
	auth: tallyAuth,
	name: 'delete_workspace',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Workspace',
	description: 'Permanently delete a workspace and everything inside it',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a workspace along with every form, folder, and submission inside it — irreversible, no trash/undo. Only use this when the caller explicitly wants to remove the entire workspace, not a single form (use Delete Form for that). A repeat call errors once the workspace is gone, so this is not idempotent.',
		idempotent: false,
	},
	props: {
		workspace_id: workspacesDropdown,
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.deleteWorkspace({ apiKey: auth.secret_text, workspaceId: propsValue.workspace_id });
		return { workspaceId: propsValue.workspace_id, deleted: true };
	},
});
