import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyFolder } from '../common/types';

export const createWorkspaceFolder = createAction({
	auth: tallyAuth,
	name: 'create_workspace_folder',
	displayName: 'Create Workspace Folder',
	description: 'Creates a folder in a workspace (requires Tally Pro).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Creates a folder in a workspace. Requires Tally Pro — non-Pro accounts receive a 403 uniformly on any folder call. Each call creates a new folder even for identical names, so retries duplicate. Use to scaffold a folder before organising forms; pair with List Workspace Folders to find an existing one first if you want idempotency.",
		idempotent: false,
	},
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The workspace to create the folder in. Obtain from List Workspaces.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Folder Name',
			description: 'Display name for the new folder.',
			required: true,
		}),
		parent_id: Property.ShortText({
			displayName: 'Parent Folder ID',
			description: 'Optional parent folder id for nesting.',
			required: false,
		}),
	},
	async run(context) {
		const body: Record<string, unknown> = { name: context.propsValue.name };
		if (context.propsValue.parent_id) body['parentId'] = context.propsValue.parent_id;
		return tallyApiClient.request<TallyFolder>({
			method: HttpMethod.POST,
			path: `/workspaces/${context.propsValue.workspace_id}/folders`,
			apiKey: context.auth.secret_text,
			body,
		});
	},
});
