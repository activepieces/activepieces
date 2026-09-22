import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient, TallyAnalyticsPeriod } from '../common/client';
import { ANALYTICS_PERIOD_OPTIONS, formsDropdown } from '../common/props';

export const getFormSubmissionAnalyticsAction = createAction({
	auth: tallyAuth,
	name: 'get_form_submission_analytics',
	classification: 'READ',
	displayName: 'Get Form Submission Analytics',
	description: 'Get completed vs partial submission counts over time for a form',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns a time-bucketed breakdown of completed vs. partial submission counts for a form over the given period. For a single summary number use Get Form Metrics instead. Read-only, safe to retry.',
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
		return tallyApiClient.getFormSubmissionAnalytics({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			period: propsValue.period as TallyAnalyticsPeriod,
		});
	},
});
