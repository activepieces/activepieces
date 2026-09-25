import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { reportUtils, SalesforceReportResponse } from '../common/report';
import { runReportSyncOutputSchema } from '../output-schemas';

export const runReport = createAction({
	auth: salesforceAuth,
	name: 'run_report',
	displayName: 'Run Report',
	description:
		'Execute a Salesforce analytics report and return the results as easy-to-use rows.',
	audience: 'human',
	aiMetadata: { description: 'Run an existing Salesforce analytics report by its report Id and get back flattened rows (detail and grouping columns) instead of raw factMap structures. Optionally pass dynamic filters to override the report\'s saved filters for this run. Use to read aggregated/reported data rather than to query raw records. Read-only and idempotent — it executes the report without changing it.', idempotent: true },
	outputSchema: runReportSyncOutputSchema,
	props: {
		report_id: salesforcesCommon.report,
		filters: Property.Json({
			displayName: 'Filters',
			description:
				"Apply dynamic filters to the report run. Leave empty to use the report's saved filters.",
			required: false,
			defaultValue: [
				{
					column: 'ACCOUNT.NAME',
					operator: 'equals',
					value: 'Acme',
				},
			],
		}),
	},
	async run(context) {
		const { report_id, filters } = context.propsValue;

		let body = undefined;
		if (filters && Array.isArray(filters) && filters.length > 0) {
			body = {
				reportMetadata: {
					reportFilters: filters,
				},
			};
		}

		const queryParam = '?includeDetails=true';

		const response = await callSalesforceApi<SalesforceReportResponse>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/analytics/reports/${report_id}${queryParam}`,
			body
		);

		const reportData = response.body;

		return reportUtils.transformReportToRows(reportData);
	},
});
