import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyGetUsageOutputSchema } from '../../output-schemas';

export const getUsageAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_get_usage',
	outputSchema: doctlyGetUsageOutputSchema,
	displayName: 'Get Usage',
	description: 'Gets credit balance and monthly usage.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads the account\'s current credit balance, auto top-up settings, and credits, pages and documents used per month, with totals and the 30-day burn rate. Use it to check whether there are enough credits before converting or extracting.',
		idempotent: true,
	},
	props: {
		months: Property.Number({ displayName: 'Months', description: 'How many calendar months to include, counting the current one (1-36). Defaults to 12.', required: false }),
	},
	async run(context) {
		const { months } = context.propsValue;
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/analytics/usage',
			query: { months: months === undefined ? undefined : String(months) },
		});
	},
});
