import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { querySalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { listDashboardsOutputSchema } from '../../output-schemas';

export const listDashboards = createAction({
	auth: salesforceAuth,
	name: 'list_dashboards',
	classification: 'SEARCH',
	displayName: 'List Dashboards',
	description: 'List dashboards, optionally filtered by title.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Salesforce dashboards (id, title, developer name, folder, description) filtered by title. Use it to find a dashboard id for Get Dashboard, which lists its components and their source reports. Returns at most 200 dashboards per call. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listDashboardsOutputSchema,
	props: {
		title_contains: Property.ShortText({
			displayName: 'Title Contains',
			description: 'Only dashboards whose title contains this text.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum dashboards to return (1-200, default 50).',
			required: false,
		}),
	},
	async run(context) {
		const { title_contains, limit } = context.propsValue;
		const where = title_contains ? ` WHERE Title LIKE '%${salesforceUtils.escapeSoqlLike(title_contains)}%'` : '';
		const soql = `SELECT Id, Title, DeveloperName, FolderName, Description, LastModifiedDate FROM Dashboard${where} ORDER BY Title LIMIT ${clampLimit(limit)}`;
		const response = await querySalesforceApi<QueryResult<unknown>>(HttpMethod.GET, context.auth, soql);
		return salesforceUtils.formatQueryResult(response.body);
	},
});

function clampLimit(limit: number | undefined): number {
	return Math.min(Math.max(Math.floor(limit ?? 50), 1), 200);
}
