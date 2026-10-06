import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getDashboardOutputSchema } from '../../output-schemas';

export const getDashboard = createAction({
	auth: salesforceAuth,
	name: 'get_dashboard',
	classification: 'READ',
	displayName: 'Get Dashboard',
	description: 'Get a dashboard with its components and filters.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Describes a Salesforce dashboard by id: name, folder, filters and each component with its header, title, type and source report id. Use the report ids with Run Report Sync to get the underlying data; use List Dashboards to find the id. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getDashboardOutputSchema,
	props: {
		dashboard_id: Property.ShortText({
			displayName: 'Dashboard ID',
			description: 'Dashboard id starting with 01Z.',
			required: true,
		}),
	},
	async run(context) {
		const dashboardId = salesforceUtils.assertId({
			value: context.propsValue.dashboard_id,
			fieldName: 'Dashboard ID',
		});
		const response = await callSalesforceApi<DashboardDescribe>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/analytics/dashboards/${dashboardId}/describe`,
			undefined,
		);
		const dashboard = response.body;
		return {
			id: dashboard.id ?? dashboardId,
			name: dashboard.name ?? null,
			developer_name: dashboard.developerName ?? null,
			folder_id: dashboard.folderId ?? null,
			components: (dashboard.components ?? []).map((component) => ({
				id: component.id,
				header: component.header ?? null,
				title: component.title ?? null,
				type: component.type ?? null,
				visualization_type: component.properties?.visualizationType ?? null,
				report_id: component.reportId ?? null,
			})),
			filters: (dashboard.filters ?? []).map((filter) => ({
				name: filter.name,
				options: (filter.options ?? []).map((option) => ({
					id: option.id ?? null,
					alias: option.alias ?? null,
					operation: option.operation ?? null,
					value: option.value ?? null,
				})),
			})),
		};
	},
});

type DashboardDescribe = {
	id?: string;
	name?: string;
	developerName?: string;
	folderId?: string;
	components?: {
		id: string;
		header?: string | null;
		title?: string | null;
		type?: string;
		reportId?: string | null;
		properties?: { visualizationType?: string };
	}[];
	filters?: {
		name: string;
		options?: { id?: string; alias?: string | null; operation?: string; value?: string | null }[];
	}[];
};
