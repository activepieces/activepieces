import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient, TallyAnalyticsPeriod } from '../common/client';
import { ANALYTICS_PERIOD_OPTIONS, formsDropdown } from '../common/props';
import { getFormMetricsActionOutputSchema } from '../output-schemas';

export const getFormMetricsAction = createAction({
	auth: tallyAuth,
	name: 'get_form_metrics',
	classification: 'READ',
	displayName: 'Get Form Metrics',
	description: 'Get summary metrics for a form over a time period',
	audience: 'ai',
	outputSchema: getFormMetricsActionOutputSchema,
	aiMetadata: {
		description:
			'Returns summary metrics for a form over the given period: visits, submissions, unique respondents, starts, completions, and completion rate. For a breakdown over time use Get Form Visit Analytics or Get Form Submission Analytics instead. Read-only, safe to retry.',
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
		return tallyApiClient.getFormMetrics({
			apiKey: auth.secret_text,
			formId: propsValue.form_id,
			period: propsValue.period as TallyAnalyticsPeriod,
		});
	},
});
