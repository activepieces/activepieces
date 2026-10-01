import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { workspacesDropdown } from '../common/props';

export const renameWorkspaceAction = createAction({
	auth: tallyAuth,
	name: 'rename_workspace',
	classification: 'WRITE',
	displayName: 'Rename Workspace',
	description: 'Rename a workspace',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renames a workspace to the given name. Repeating the same call converges on the same state, so it is idempotent.',
		idempotent: true,
	},
	props: {
		workspace_id: workspacesDropdown,
		name: Property.ShortText({
			displayName: 'New Name',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		await tallyApiClient.renameWorkspace({
			apiKey: auth.secret_text,
			workspaceId: propsValue.workspace_id,
			name: propsValue.name,
		});
		return { workspaceId: propsValue.workspace_id, name: propsValue.name };
	},
});
