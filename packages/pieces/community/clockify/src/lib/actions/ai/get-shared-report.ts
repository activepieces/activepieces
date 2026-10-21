import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { sharedReportDataOutputSchema } from '../../output-schemas';

export const getSharedReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_shared_report',
	outputSchema: sharedReportDataOutputSchema,
	displayName: 'Get Shared Report',
	description: 'Runs a shared report and returns its data.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Runs a shared report by ID and returns its data (totals and rows, in the shape of its type), optionally for a different period than it was saved with.',
		idempotent: true,
	},
	props: {
		sharedReportId: clockifyAiProps.sharedReportId({ required: true }),
		dateRangeStart: clockifyAiProps.dateRangeStart({
			required: false,
			description: 'Optional start of the period, ISO 8601. Empty = the saved period.',
		}),
		dateRangeEnd: clockifyAiProps.dateRangeEnd({
			required: false,
			description: 'Optional end of the period, ISO 8601. Empty = the saved period.',
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getSharedReport({
			auth,
			sharedReportId: propsValue.sharedReportId,
			query: clockifyUtils.toQuery({
				params: {
					dateRangeStart: propsValue.dateRangeStart,
					dateRangeEnd: propsValue.dateRangeEnd,
					exportType: 'JSON',
					page: propsValue.page ?? 1,
					pageSize: propsValue.pageSize ?? 50,
				},
			}),
		});
	},
});
