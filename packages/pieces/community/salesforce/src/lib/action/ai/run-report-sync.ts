import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { reportUtils, SalesforceReportResponse } from '../../common/report';
import { salesforceUtils } from '../../common/utils';
import { runReportSyncOutputSchema } from '../../output-schemas';

export const runReportSync = createAction({
	auth: salesforceAuth,
	name: 'run_report_sync',
	classification: 'READ',
	displayName: 'Run Report Sync',
	description: 'Run a report now and return its rows.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Runs a Salesforce report by id and waits for the result, returning flat rows keyed by column label (grouping columns included), optionally with filters that override the saved ones for this run. Synchronous runs return at most 2,000 detail rows; for bigger reports use Run Report Async then Get Report Instance. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: runReportSyncOutputSchema,
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
		const response = await callSalesforceApi<SalesforceReportResponse>(
			HttpMethod.POST,
			context.auth,
			`/services/data/v56.0/analytics/reports/${reportId}?includeDetails=true`,
			filters && filters.length > 0 ? { reportMetadata: { reportFilters: filters } } : undefined,
		);
		return reportUtils.transformReportToRows(response.body);
	},
});
