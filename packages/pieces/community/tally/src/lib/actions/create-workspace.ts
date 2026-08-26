import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyWorkspace } from '../common/types';

export const createWorkspace = createAction({
	auth: tallyAuth,
	name: 'create_workspace',
	displayName: 'Create Workspace',
	description: 'Creates a new workspace (requires Tally Pro).',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Creates a new Tally workspace. Requires a Tally Pro subscription — accounts without Pro receive a 403. Each call creates a new workspace even for identical names, so retries duplicate. Use to scaffold a dedicated workspace before creating forms under it. If the call 403s uniformly on this account, prefer List Workspaces + Create Form on an existing workspace instead.",
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Display name for the new workspace.',
			required: true,
		}),
	},
	async run(context) {
		return tallyApiClient.request<TallyWorkspace>({
			method: HttpMethod.POST,
			path: '/workspaces',
			apiKey: context.auth.secret_text,
			body: { name: context.propsValue.name },
		});
	},
});
