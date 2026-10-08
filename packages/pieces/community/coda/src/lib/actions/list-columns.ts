import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaPage, codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { listColumnsActionOutputSchema } from '../output-schemas';

export const listColumnsAction = createAction({
	auth: codaAuth,
	name: 'list_columns',
	classification: 'SEARCH',
	displayName: 'List Columns',
	description: 'Lists a table\'s columns with their IDs, names and types, one page at a time.',
	audience: 'both',
	aiMetadata: {
		description: 'Lists the columns of a Coda table with ID, name, type (text, number, date, checkbox, select, button…), whether it is calculated (read-only) and whether it is the display column. Use before writing rows to learn the column names and which ones accept values. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		visibleOnly: Property.Checkbox({
			displayName: 'Visible Columns Only',
			required: false,
			defaultValue: false,
		}),
		limit: codaProps.limit({ max: 100, defaultValue: 100 }),
		pageToken: codaProps.pageToken(),
	},
	outputSchema: listColumnsActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, visibleOnly, limit, pageToken } = context.propsValue;
		const page = await codaApi.request<CodaPage<unknown>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/columns`,
			operation: 'list columns',
			query: {
				visibleOnly: visibleOnly === true ? true : undefined,
				limit: codaApi.validateLimit({ limit, max: 100 }),
				pageToken: pageToken?.trim(),
			},
		});
		return codaApi.toPageOutput(page);
	},
});
