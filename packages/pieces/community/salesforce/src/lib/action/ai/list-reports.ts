import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { querySalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { listReportsOutputSchema } from '../../output-schemas';

export const listReports = createAction({
	auth: salesforceAuth,
	name: 'list_reports',
	classification: 'SEARCH',
	displayName: 'List Reports',
	description: 'List reports, optionally filtered by name or folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Salesforce analytics reports (id, name, folder, format, last run) filtered by name or exact folder name. Use it to find a report id, then Get Report to see its columns or Run Report Sync / Run Report Async to get data. Returns at most 200 reports per call. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listReportsOutputSchema,
	props: {
		name_contains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only reports whose name contains this text.',
			required: false,
		}),
		folder_name: Property.ShortText({
			displayName: 'Folder Name',
			description: 'Only reports in the folder with exactly this name.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum reports to return (1-200, default 50).',
			required: false,
		}),
	},
	async run(context) {
		const { name_contains, folder_name, limit } = context.propsValue;
		const conditions = [
			name_contains ? `Name LIKE '%${salesforceUtils.escapeSoqlLike(name_contains)}%'` : undefined,
			folder_name ? `FolderName = '${salesforceUtils.escapeSoqlValue(folder_name)}'` : undefined,
		].filter((condition) => condition !== undefined);
		const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
		const soql = `SELECT Id, Name, DeveloperName, FolderName, Format, Description, LastRunDate, LastModifiedDate FROM Report${where} ORDER BY Name LIMIT ${clampLimit(limit)}`;
		const response = await querySalesforceApi<QueryResult<unknown>>(HttpMethod.GET, context.auth, soql);
		return salesforceUtils.formatQueryResult(response.body);
	},
});

function clampLimit(limit: number | undefined): number {
	return Math.min(Math.max(Math.floor(limit ?? 50), 1), 200);
}
