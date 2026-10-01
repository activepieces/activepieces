import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient, TallyAnalyticsPeriod } from '../common/client';
import { ANALYTICS_PERIOD_OPTIONS, formsDropdown } from '../common/props';

export const getFormDropOffAnalyticsAction = createAction({
	auth: tallyAuth,
	name: 'get_form_drop_off_analytics',
	classification: 'READ',
	displayName: 'Get Form Drop-off Analytics',
	description: 'Get per-question drop-off rates for a form',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns per-question view/answer/drop counts and drop-off rates for a form over the given period, so you can identify which question loses the most respondents. Read-only, safe to retry.',
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
		return tallyApiClient.getFormDropOffAnalytics({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			period: propsValue.period as TallyAnalyticsPeriod,
		});
	},
});
