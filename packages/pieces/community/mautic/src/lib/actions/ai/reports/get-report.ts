import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetReportOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetReportAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_report',
	outputSchema: mauticGetReportOutputSchema,
	displayName: 'Get Report',
	description: 'Runs a saved Mautic report and returns its rows.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Runs a saved report and returns its rows for a date range, with the total count. Page with Page and Limit. Defaults to the report's own date range.",
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Report Id',
			description: 'Numeric report id, from List Reports or Create Report.',
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
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Rows per page.',
			required: false,
		}),
	},
	async run(context) {
		const { id, dateFrom, dateTo, page, limit } = context.propsValue;
		return await mauticApi.getReport({
			auth: context.auth,
			id,
			query: {
				...spreadIfDefined('dateFrom', dateFrom),
				...spreadIfDefined('dateTo', dateTo),
				...spreadIfDefined('page', page?.toString()),
				...spreadIfDefined('limit', limit?.toString()),
			},
		});
	},
});
