import { createAction } from '@activepieces/pieces-framework';

import { mauticGetCurrentUserOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticApi } from '../../../common/api';

export const mauticGetCurrentUserAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_current_user',
	outputSchema: mauticGetCurrentUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the Mautic user the connection signs in as.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the user this connection signs in as, with role and permissions. Use it to find your own user id.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mauticApi.getCurrentUser({ auth: context.auth });
	},
});
