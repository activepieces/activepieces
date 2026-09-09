import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';

export const createWorkspaceAction = createAction({
	auth: tallyAuth,
	name: 'create_workspace',
	classification: 'WRITE',
	displayName: 'Create Workspace',
	description: 'Create a new workspace',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new workspace by name. Requires a Pro (or higher) subscription — fails with a permission error on a Free plan. Each call creates a new workspace, so it is not idempotent (retries duplicate).',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.createWorkspace({ apiKey: auth.secret_text, name: propsValue.name });
	},
});
