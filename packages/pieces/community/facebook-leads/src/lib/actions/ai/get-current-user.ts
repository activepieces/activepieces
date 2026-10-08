import { createAction } from '@activepieces/pieces-framework';

import { facebookLeadsAuth } from '../../auth';
import { facebookLeadsApi } from '../../common/api';
import { facebookLeadsGetCurrentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
	auth: facebookLeadsAuth,
	name: 'facebook_leads_get_current_user',
	outputSchema: facebookLeadsGetCurrentUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the Facebook user the connection belongs to.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the id and name of the Facebook user behind this connection. Use it to confirm which account is connected; use List Pages to see the Pages it manages.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await facebookLeadsApi.getMe({ accessToken: context.auth.access_token });
	},
});
