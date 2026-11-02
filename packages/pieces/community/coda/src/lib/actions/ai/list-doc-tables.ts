import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { CodaPage, codaApi } from '../../common/client';
import { codaProps } from '../../common/ai-props';
import { listDocTablesActionOutputSchema } from '../../output-schemas';

export const listDocTablesAction = createAction({
	auth: codaAuth,
	name: 'list_doc_tables',
	classification: 'SEARCH',
	displayName: 'List Tables (by Doc ID)',
	description: 'Lists the tables and views in a doc, one page at a time.',
	audience: 'ai',
	aiMetadata: {
		description: 'Lists the tables (and optionally views) in a Coda doc given its ID or link, with each table ID, name, type and page, one page at a time. Use to find a table ID before List Columns or List Rows; pass Next Page Token to continue. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableTypes: Property.StaticDropdown({
			displayName: 'Include',
			required: false,
			defaultValue: 'table',
			options: {
				disabled: false,
				options: [
					{ label: 'Tables only', value: 'table' },
					{ label: 'Views only', value: 'view' },
					{ label: 'Tables and views', value: 'table,view' },
				],
			},
		}),
		limit: codaProps.limit({ max: 100, defaultValue: 25 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listDocTablesActionOutputSchema,
	async run(context) {
		const { docId, tableTypes, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/tables`,
			operation: 'list tables',
			query: {
				tableTypes: tableTypes ?? 'table',
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
