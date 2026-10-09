import { createAction } from '@activepieces/pieces-framework';

import { mailjetProfileOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetApi } from '../../../common/api';

export const mailjetGetProfileAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_profile',
	outputSchema: mailjetProfileOutputSchema,
	displayName: 'Get Profile',
	description: 'Gets the account company profile.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the company profile of the account (company name, address, contact details).',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/myprofile',
		});
	},
});
