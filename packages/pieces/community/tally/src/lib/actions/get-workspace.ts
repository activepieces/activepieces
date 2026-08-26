import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyWorkspace } from '../common/types';
import { getWorkspaceOutputSchema } from '../output-schemas';

export const getWorkspace = createAction({
	auth: tallyAuth,
	name: 'get_workspace',
	displayName: 'Get Workspace',
	description: 'Fetches a workspace by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a single workspace by id, returning its name, slug, and timestamps. Use to inspect workspace details before Update Workspace or folder operations. Obtain the id from List Workspaces or Get Current User.',
		idempotent: true,
	},
	outputSchema: getWorkspaceOutputSchema,
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The id of the workspace. Obtain from List Workspaces.',
			required: true,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallyWorkspace>({
			method: HttpMethod.GET,
			path: `/workspaces/${context.propsValue.workspace_id}`,
			apiKey: context.auth.secret_text,
		});
	},
});
