import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { reportUtils, SalesforceReportResponse } from '../../common/report';
import { salesforceUtils } from '../../common/utils';
import { getReportInstanceOutputSchema } from '../../output-schemas';

export const getReportInstance = createAction({
	auth: salesforceAuth,
	name: 'get_report_instance',
	classification: 'READ',
	displayName: 'Get Report Instance',
	description: 'Check an async report run and get its rows when it is done.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the status of a report run started with Run Report Async (New, Running, Success or Error) and, once the status is Success, its flat rows keyed by column label. Call it again later while the status is New or Running. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getReportInstanceOutputSchema,
	props: {
		report_id: Property.ShortText({
			displayName: 'Report ID',
			description: 'Report id starting with 00O.',
			required: true,
		}),
		instance_id: Property.ShortText({
			displayName: 'Instance ID',
			description: 'Instance id returned by Run Report Async.',
			required: true,
		}),
	},
	async run(context) {
		const reportId = salesforceUtils.assertId({ value: context.propsValue.report_id, fieldName: 'Report ID' });
		const instanceId = salesforceUtils.assertId({ value: context.propsValue.instance_id, fieldName: 'Instance ID' });
		const response = await callSalesforceApi<SalesforceReportResponse>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/analytics/reports/${reportId}/instances/${instanceId}`,
			undefined,
		);
		const status = response.body.attributes?.status ?? 'Unknown';
		if (status !== 'Success') {
			return { instance_id: instanceId, status, reportId };
		}
		return {
			instance_id: instanceId,
			status,
			...reportUtils.transformReportToRows(response.body),
		};
	},
});
