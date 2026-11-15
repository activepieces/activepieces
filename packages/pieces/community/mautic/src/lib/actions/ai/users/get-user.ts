import { createAction } from '@activepieces/pieces-framework';

import { mauticGetUserOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetUserAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_user',
	outputSchema: mauticGetUserOutputSchema,
	displayName: 'Get User',
	description: 'Gets one Mautic user by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single user by its numeric id, with role and permissions.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'User Id',
			description: 'Numeric user id, from List Users or Create User.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'users',
			id: context.propsValue.id,
		});
	},
});
