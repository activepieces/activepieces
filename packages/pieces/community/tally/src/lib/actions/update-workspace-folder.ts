import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyFolder } from '../common/types';

export const updateWorkspaceFolder = createAction({
	auth: tallyAuth,
	name: 'update_workspace_folder',
	displayName: 'Update Workspace Folder',
	description: 'Renames a folder inside a workspace (requires Tally Pro).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Renames a folder inside a workspace. Requires Tally Pro. Only fields you supply are changed — omitted fields keep their current value; supplying the same name again is safe. Requires both the workspace id (from List Workspaces) and the folder id (from List Workspace Folders).",
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
			description: 'The folder to update. Obtain from List Workspace Folders.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name. Leave empty to keep unchanged.',
			required: false,
		}),
	},
	async run(context) {
		const body: Record<string, unknown> = {};
		if (context.propsValue.name !== undefined && context.propsValue.name !== '') {
			body['name'] = context.propsValue.name;
		}
		return tallyApiClient.request<TallyFolder>({
			method: HttpMethod.PATCH,
			path: `/workspaces/${context.propsValue.workspace_id}/folders/${context.propsValue.folder_id}`,
			apiKey: context.auth.secret_text,
			body,
		});
	},
});
