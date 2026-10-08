import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getReportOutputSchema } from '../../output-schemas';

export const getReport = createAction({
	auth: salesforceAuth,
	name: 'get_report',
	classification: 'READ',
	displayName: 'Get Report',
	description: 'Get the definition of a report: columns, groupings and filters.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Describes a Salesforce report by id without running it: format, report type, detail columns with labels, groupings, saved filters and filter logic. Use it to learn the column API names before passing filters to Run Report Sync or Run Report Async; use List Reports to find the id. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getReportOutputSchema,
	props: {
		report_id: Property.ShortText({
			displayName: 'Report ID',
			description: 'Report id starting with 00O.',
			required: true,
		}),
	},
	async run(context) {
		const reportId = salesforceUtils.assertId({ value: context.propsValue.report_id, fieldName: 'Report ID' });
		const response = await callSalesforceApi<ReportDescribe>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/analytics/reports/${reportId}/describe`,
			undefined,
		);
		const metadata = response.body.reportMetadata;
		const columnInfo = response.body.reportExtendedMetadata?.detailColumnInfo ?? {};
		return {
			id: metadata.id,
			name: metadata.name,
			developer_name: metadata.developerName ?? null,
			format: metadata.reportFormat ?? null,
			report_type: metadata.reportType?.type ?? null,
			report_type_label: metadata.reportType?.label ?? null,
			detail_columns: metadata.detailColumns ?? [],
			groupings_down: (metadata.groupingsDown ?? []).map((grouping) => grouping.name),
			filters: metadata.reportFilters ?? [],
			filter_logic: metadata.reportBooleanFilter ?? null,
			columns: Object.entries(columnInfo).map(([apiName, info]) => ({
				api_name: apiName,
				label: info.label,
				data_type: info.dataType,
			})),
		};
	},
});

type ReportDescribe = {
	reportMetadata: {
		id: string;
		name: string;
		developerName?: string;
		reportFormat?: string;
		reportType?: { type: string; label: string };
		detailColumns?: string[];
		groupingsDown?: { name: string }[];
		reportFilters?: { column: string; operator: string; value: string }[];
		reportBooleanFilter?: string | null;
	};
	reportExtendedMetadata?: {
		detailColumnInfo?: Record<string, { label: string; dataType: string }>;
	};
};
