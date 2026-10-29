import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetCurrentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_current_user',
	outputSchema: confluenceGetCurrentUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the connected user.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the Confluence user the connection is signed in as, including their account ID, display name and email.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await confluenceApi.getCurrentUser({ auth: context.auth });
	},
});
