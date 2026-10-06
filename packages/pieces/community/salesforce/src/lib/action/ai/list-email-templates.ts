import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { querySalesforceApi } from '../../common';
import { QueryResult, salesforceUtils } from '../../common/utils';
import { listEmailTemplatesOutputSchema } from '../../output-schemas';

export const listEmailTemplates = createAction({
	auth: salesforceAuth,
	name: 'list_email_templates',
	classification: 'SEARCH',
	displayName: 'List Email Templates',
	description: 'List email templates, optionally filtered by name or folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists Salesforce email templates (classic and Lightning) with their folder, type, subject and active flag, filtered by name, folder id or active only. Use it to look up a template id or developer name; it does not send anything, use Send Email Message for that. Returns at most 200 templates per call. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listEmailTemplatesOutputSchema,
	props: {
		name_contains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only templates whose name contains this text.',
			required: false,
		}),
		folder_id: Property.ShortText({
			displayName: 'Folder ID',
			description: 'Only templates in this folder.',
			required: false,
		}),
		active_only: Property.Checkbox({
			displayName: 'Active Only',
			required: false,
			defaultValue: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum templates to return (1-200, default 50).',
			required: false,
		}),
	},
	async run(context) {
		const { name_contains, folder_id, active_only, limit } = context.propsValue;
		const conditions = [
			name_contains ? `Name LIKE '%${salesforceUtils.escapeSoqlLike(name_contains)}%'` : undefined,
			folder_id
				? `FolderId = '${salesforceUtils.assertId({ value: folder_id, fieldName: 'Folder ID' })}'`
				: undefined,
			active_only ? 'IsActive = true' : undefined,
		].filter((condition) => condition !== undefined);
		const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
		const soql = `SELECT Id, Name, DeveloperName, Subject, FolderId, Folder.Name, TemplateType, IsActive, LastModifiedDate FROM EmailTemplate${where} ORDER BY Name LIMIT ${clampLimit(limit)}`;
		const response = await querySalesforceApi<QueryResult<unknown>>(HttpMethod.GET, context.auth, soql);
		return salesforceUtils.formatQueryResult(response.body);
	},
});

function clampLimit(limit: number | undefined): number {
	return Math.min(Math.max(Math.floor(limit ?? 50), 1), 200);
}
