import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';

export const deleteWorkspace = createAction({
	auth: tallyAuth,
	name: 'delete_workspace',
	displayName: 'Delete Workspace',
	description: 'Deletes a workspace and cascades to all its forms.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Deletes a Tally workspace by id. Cascades to every form owned by the workspace, so blast radius is large — only invoke when the caller has explicitly named the workspace to remove. The delete is a soft-delete on Tally's side (recoverable through their UI within the retention window). Re-invoking on an already-deleted workspace is a no-op.",
		idempotent: true,
	},
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The id of the workspace to delete. Obtain from List Workspaces.',
			required: true,
		}),
	},
	async run(context) {
		await tallyApiClient.request<void>({
			method: HttpMethod.DELETE,
			path: `/workspaces/${context.propsValue.workspace_id}`,
			apiKey: context.auth.secret_text,
		});
		return { workspace_id: context.propsValue.workspace_id, deleted: true };
	},
});
