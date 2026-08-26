import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { getFormDropOffOutputSchema } from '../output-schemas';

export const getFormDropOff = createAction({
	auth: tallyAuth,
	name: 'get_form_drop_off',
	displayName: 'Get Form Drop-off',
	description: 'Returns per-question drop-off statistics for a form.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns per-question drop-off statistics for a form — how many respondents made it through each question before abandoning. Use to identify problematic questions that lose respondents. Pair with List Form Questions to translate question ids to titles.",
		idempotent: true,
	},
	outputSchema: getFormDropOffOutputSchema,
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
			description: 'Start of the window (ISO 8601). Optional.',
			required: false,
		}),
		to: Property.DateTime({
			displayName: 'To',
			description: 'End of the window (ISO 8601). Optional.',
			required: false,
		}),
	},
	async run(context) {
		const queryParams: Record<string, string> = { period: context.propsValue.period };
		if (context.propsValue.from) queryParams['from'] = context.propsValue.from;
		if (context.propsValue.to) queryParams['to'] = context.propsValue.to;
		return tallyApiClient.request<Record<string, unknown>>({
			method: HttpMethod.GET,
			path: `/forms/${context.propsValue.form_id}/analytics/drop-off`,
			apiKey: context.auth.secret_text,
			queryParams,
		});
	},
});
