import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetDashboardWidgetDataOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetDashboardWidgetDataAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_dashboard_widget_data',
	outputSchema: mauticGetDashboardWidgetDataOutputSchema,
	displayName: 'Get Dashboard Widget Data',
	description: 'Gets the data of a Mautic dashboard widget.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the chart or table data of one dashboard widget type for a date range, e.g. contacts created per day. Widget types come from List Dashboard Widget Types.',
		idempotent: true,
	},
	props: {
		type: mauticAiProps.recordId({
			displayName: 'Widget Type',
			description: 'Widget type key, from List Dashboard Widget Types.',
		}),
		dateFrom: Property.ShortText({
			displayName: 'Date From',
			description: 'Date in UTC, e.g. "2026-01-31".',
			required: false,
		}),
		dateTo: Property.ShortText({
			displayName: 'Date To',
			description: 'Date in UTC, e.g. "2026-01-31".',
			required: false,
		}),
		timeUnit: Property.StaticDropdown({
			displayName: 'Time Unit',
			description: 'Grouping of time charts. Defaults to Year.',
			required: false,
			options: {
				options: [
					{ label: 'Year', value: 'Y' },
					{ label: 'Month', value: 'm' },
					{ label: 'Week', value: 'W' },
					{ label: 'Day', value: 'd' },
					{ label: 'Hour', value: 'H' },
				],
			},
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: 'e.g. "Europe/Berlin". Defaults to UTC.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum rows for table widgets.',
			required: false,
		}),
	},
	async run(context) {
		const { type, dateFrom, dateTo, timeUnit, timezone, limit } = context.propsValue;
		return await mauticApi.getDashboardData({
			auth: context.auth,
			type,
			query: {
				...spreadIfDefined('dateFrom', dateFrom),
				...spreadIfDefined('dateTo', dateTo),
				...spreadIfDefined('timeUnit', timeUnit),
				...spreadIfDefined('timezone', timezone),
				...spreadIfDefined('limit', limit?.toString()),
			},
		});
	},
});
