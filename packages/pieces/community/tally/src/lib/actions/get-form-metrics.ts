import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { getFormMetricsOutputSchema } from '../output-schemas';

export const getFormMetrics = createAction({
	auth: tallyAuth,
	name: 'get_form_metrics',
	displayName: 'Get Form Metrics',
	description: 'Returns aggregate analytics for a form over a time window.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns aggregate performance metrics for a form (total visits, submissions, completion rate, average time) over an optional date range. Use for headline KPIs on a single form; call Get Form Visits or Get Form Submissions Timeseries for per-day breakdowns.',
		idempotent: true,
	},
	outputSchema: getFormMetricsOutputSchema,
	props: {
		form_id: Property.ShortText({
			displayName: 'Form ID',
			description: 'The id of the form. Obtain from List Forms.',
			required: true,
		}),
		period: Property.StaticDropdown({
			displayName: 'Period',
			description: 'Bucket size for the analytics window.',
			required: true,
			defaultValue: '7d',
			options: {
				options: [
					{ label: 'Today', value: 'today' },
					{ label: 'Yesterday', value: 'yesterday' },
					{ label: 'Last 24 hours', value: '24h' },
					{ label: 'Last 7 days', value: '7d' },
					{ label: 'Last 30 days', value: '30d' },
					{ label: 'Last 3 months', value: '3m' },
					{ label: 'Last 6 months', value: '6m' },
					{ label: 'Last 12 months', value: '12m' },
					{ label: 'All time', value: 'all' },
				],
			},
		}),
		from: Property.DateTime({
			displayName: 'From',
			description: 'Start of the reporting window (ISO 8601). Optional.',
			required: false,
		}),
		to: Property.DateTime({
			displayName: 'To',
			description: 'End of the reporting window (ISO 8601). Optional.',
			required: false,
		}),
	},
	async run(context) {
		const queryParams: Record<string, string> = { period: context.propsValue.period };
		if (context.propsValue.from) queryParams['from'] = context.propsValue.from;
		if (context.propsValue.to) queryParams['to'] = context.propsValue.to;
		return tallyApiClient.request<Record<string, unknown>>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}/analytics/metrics`,
			apiKey: context.auth.secret_text,
			queryParams,
		});
	},
});
