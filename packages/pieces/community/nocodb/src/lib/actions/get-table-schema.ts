import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbGetTableSchemaOutputSchema } from '../output-schemas';

export const getTableSchemaAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-get-table-schema',
	outputSchema: nocodbGetTableSchemaOutputSchema,
	classification: 'READ',
	displayName: 'Get Table Schema',
	description: 'Returns the columns and metadata of the given table.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns a table\'s columns (name, id, type, and select options) and metadata. Use before creating or updating a record to see which fields exist and what values they accept, or to resolve a column ID for the view-column actions. Idempotent read-only lookup.',
		idempotent: true,
	},
	props: {
		baseId: Property.ShortText({
			displayName: 'Base ID',
			required: true,
		}),
		tableId: Property.ShortText({
			displayName: 'Table ID',
			required: true,
		}),
	},
	async run(context) {
		const { baseId, tableId } = context.propsValue;
		const client = makeClient(context.auth);
		const version = context.auth.props.version || 3;
		return version === 4
			? await client.getTableV3(baseId, tableId, version)
			: await client.getTable(baseId, tableId, version);
	},
});
