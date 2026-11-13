import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { codaApi } from '../../common/client';
import { codaProps } from '../../common/ai-props';
import { getRowActionOutputSchema } from '../../output-schemas';

export const getRowByIdAction = createAction({
	auth: codaAuth,
	name: 'get_row_by_id',
	classification: 'READ',
	displayName: 'Get Row (by ID)',
	description: 'Gets one row by doc ID, table ID and row ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one Coda row with its values keyed by column name, given the doc, table and row ID. Use when you already have the row ID (from List Rows or a write); use List Rows to search by value. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		rowIdOrName: codaProps.rowIdOrName(),
		valueFormat: Property.StaticDropdown({
			displayName: 'Value Format',
			required: false,
			defaultValue: 'simpleWithArrays',
			options: {
				disabled: false,
				options: [
					{ label: 'Simple (lists as arrays)', value: 'simpleWithArrays' },
					{ label: 'Simple (lists as text)', value: 'simple' },
					{ label: 'Rich (links, people, currency as objects)', value: 'rich' },
				],
			},
		}),
	},
	outputSchema: getRowActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, rowIdOrName, valueFormat } = context.propsValue;
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows/${codaApi.pathSegment({ value: rowIdOrName, label: 'Row ID' })}`,
			operation: 'get row',
			query: { useColumnNames: true, valueFormat: valueFormat ?? 'simpleWithArrays' },
		});
	},
});
