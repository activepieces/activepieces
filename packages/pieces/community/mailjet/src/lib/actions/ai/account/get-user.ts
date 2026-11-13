import { createAction } from '@activepieces/pieces-framework';

import { mailjetUserOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetGetUserAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_user',
	outputSchema: mailjetUserOutputSchema,
	displayName: 'Get User',
	description: 'Gets the account user settings.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets the user of the account (email, locale, timezone, creation date).',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/user',
		});
	},
});
