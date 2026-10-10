import { createAction } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformApi } from '../../../common/api';
import { opnformGetCurrentUserOutputSchema } from '../../../output-schemas';

export const opnformGetCurrentUserAction = createAction({
	auth: opnformAuth,
	name: 'opnform_get_current_user',
	outputSchema: opnformGetCurrentUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the OpnForm user that owns the connected API key.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the OpnForm user that owns the connected API key, to check which account the connection acts as.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await opnformApi.getCurrentUser({ auth: context.auth });
	},
});
