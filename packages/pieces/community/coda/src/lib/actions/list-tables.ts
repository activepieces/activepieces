import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { CodaTableReference, codaClient } from '../common/types';
import { docIdDropdown } from '../common/props';

export const listTablesAction = createAction({
	auth: codaAuth,
	name: 'list-tables',
	displayName: 'List Table(s)',
	description: 'List tables in a selected document.',
	audience: 'both',
	aiMetadata: { description: 'List the tables in a Coda doc, up to a caller-specified maximum, returning each table reference. Use to discover available tables and their IDs before reading or writing rows. Read-only and idempotent.', idempotent: true },
	props: {
		docId: docIdDropdown,
		max: Property.Number({
			displayName: 'Max Tables',
			description: 'Maximum number of results to return.',
			required: true,
		}),
	},
	async run(context) {
		const { docId, max } = context.propsValue;
		const client = codaClient(context.auth);

		const allTables: CodaTableReference[] = [];
		let nextPageToken: string | undefined = undefined;

		do {
			const response = await client.listTables(docId as string, {
				limit: 100,
				sortBy: 'name',
				tableTypes: 'table',
				pageToken: nextPageToken,
			});

			if (response.items) {
				allTables.push(...response.items);
			}
			nextPageToken = response.nextPageToken;
		} while (nextPageToken && allTables.length < max);

		if (allTables.length > max) allTables.length = max;

		return {
			found: allTables.length > 0,
			result: allTables,
		};
	},
});
