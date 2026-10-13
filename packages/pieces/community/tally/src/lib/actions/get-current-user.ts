import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { getCurrentUserActionOutputSchema } from '../output-schemas';

export const getCurrentUserAction = createAction({
	auth: tallyAuth,
	name: 'get_current_user',
	classification: 'READ',
	displayName: 'Get Current User',
	description: 'Get the connected account\'s profile and subscription plan',
	audience: 'ai',
	outputSchema: getCurrentUserActionOutputSchema,
	aiMetadata: {
		description:
			'Returns the connected account\'s profile (name, email) and subscription plan (FREE, PRO, or BUSINESS). Use to check whether the account can call Pro-gated atomics like Create Workspace or the folder actions before attempting them. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const { auth } = context;
		return tallyApiClient.getCurrentUser({ apiKey: auth.secret_text });
	},
});
