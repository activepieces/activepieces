import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getAccountInfoActionOutputSchema } from '../output-schemas';

export const getAccountInfo = createAction({
	auth: sendinblueAuth,
	name: 'get_account_info',
	outputSchema: getAccountInfoActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Account Info',
	description: 'Fetch the Brevo account holder information, plan and credits.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Retrieves the Brevo account holder details, address, plan/credits and transactional-email and marketing-automation configuration for the connected account. Use this to check remaining email or SMS credits, or to verify which Brevo account/plan a connection points to, before running a bulk send. Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/account',
		});

		return response;
	},
});
