import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { runReportAsyncOutputSchema } from '../../output-schemas';

export const runReportAsync = createAction({
	auth: salesforceAuth,
	name: 'run_report_async',
	classification: 'READ',
	displayName: 'Run Report Async',
	description: 'Start a report run in the background.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts an asynchronous run of a Salesforce report by id, optionally with filters overriding the saved ones, and returns the instance id right away. Poll Get Report Instance with the report id and instance id until the status is Success to get the rows; use it instead of Run Report Sync for reports over 2,000 detail rows. Results are kept for 24 hours. Not idempotent: every call starts another run.',
		idempotent: false,
	},
	outputSchema: runReportAsyncOutputSchema,
	props: {
		report_id: Property.ShortText({
			displayName: 'Report ID',
			description: 'Report id starting with 00O.',
			required: true,
		}),
		filters: Property.Json({
			displayName: 'Filters',
			description:
				'Optional JSON array of {column, operator, value} using column API names from Get Report, e.g. [{"column":"ACCOUNT.NAME","operator":"equals","value":"Acme"}].',
			required: false,
		}),
	},
	async run(context) {
		const reportId = salesforceUtils.assertId({ value: context.propsValue.report_id, fieldName: 'Report ID' });
		const filters = salesforceUtils.parseJsonArray({ value: context.propsValue.filters, fieldName: 'Filters' });
		const response = await callSalesforceApi<ReportInstance>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/analytics/reports/${reportId}/instances?includeDetails=true`,
			filters && filters.length > 0 ? { reportMetadata: { reportFilters: filters } } : undefined,
		);
		return {
			instance_id: response.body.id,
			status: response.body.status,
			report_id: reportId,
			request_date: response.body.requestDate ?? null,
		};
	},
});

type ReportInstance = {
	id: string;
	status: string;
	requestDate?: string;
};
