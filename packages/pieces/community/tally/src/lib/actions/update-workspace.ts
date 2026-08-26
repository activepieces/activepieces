import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyWorkspace } from '../common/types';

export const updateWorkspace = createAction({
	auth: tallyAuth,
	name: 'update_workspace',
	displayName: 'Update Workspace',
	description: "Partially updates a workspace's name.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Partially updates a workspace by id. Omitted fields keep their current value; providing the same value again is safe. Use to rename a workspace. Requires the workspace id from List Workspaces.",
		idempotent: true,
	},
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The id of the workspace to update. Obtain from List Workspaces.',
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
		return tallyApiClient.request<TallyWorkspace>({
			method: HttpMethod.PATCH,
			path: `/workspaces/${context.propsValue.workspace_id}`,
			apiKey: context.auth.secret_text,
			body,
		});
	},
});
