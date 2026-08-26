import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import type { TallyUser } from '../common/types';
import { getCurrentUserOutputSchema } from '../output-schemas';

export const getCurrentUser = createAction({
	auth: tallyAuth,
	name: 'get_current_user',
	displayName: 'Get Current User',
	description: 'Fetches the profile of the authenticated Tally user.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches the profile of the authenticated Tally user, including id, email, name, role, and the list of workspaces the user belongs to. Use to introspect the connected account before workspace or form operations, or to resolve a default workspace id for downstream calls.',
		idempotent: true,
	},
	outputSchema: getCurrentUserOutputSchema,
	props: {},
	async run(context) {
		return tallyApiClient.request<TallyUser>({
			method: HttpMethod.GET,
			path: '/users/me',
			apiKey: context.auth.secret_text,
		});
	},
});
