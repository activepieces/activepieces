import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient, TallyAnalyticsPeriod } from '../common/client';
import { ANALYTICS_PERIOD_OPTIONS, formsDropdown } from '../common/props';

export const getFormAnalyticsDimensionsAction = createAction({
	auth: tallyAuth,
	name: 'get_form_analytics_dimensions',
	classification: 'READ',
	displayName: 'Get Form Analytics Dimensions',
	description: 'Get visitor breakdowns by source, browser, OS, device, and location for a form',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns visitor counts broken down by traffic source, browser, OS, device, country, and city for a form over the given period. Use to answer "where are visitors coming from" style questions. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		form_id: formsDropdown,
		period: Property.StaticDropdown({
			displayName: 'Period',
			required: true,
			options: { disabled: false, options: ANALYTICS_PERIOD_OPTIONS },
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.getFormAnalyticsDimensions({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			period: propsValue.period as TallyAnalyticsPeriod,
		});
	},
});
