import { createAction, Property } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrRecords } from '../common/records';
import { databaseIdDropdown, tableFieldIdDropdown, tableIdDropdown } from '../common/props';
import { softrSearch } from '../common/search';
import { softrOutputSchemas } from '../output-schemas';

export const findDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'findDatabaseRecord',
	classification: 'SEARCH',
	displayName: 'Find Database Record',
	description: 'Finds the first record where a field equals a value.',
	audience: 'both',
	aiMetadata: {
		description:
			'Finds the first record in a Softr table where one field equals a value. Returns found (true or false) and the record. For several conditions, other operators or many results, use Find Records. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		fieldId: tableFieldIdDropdown,
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			description: 'The value to match exactly. Use "true" or "false" for checkbox fields.',
			required: true,
		}),
	},
	outputSchema: softrOutputSchemas.findRecord,
	async run({ auth, propsValue }) {
		const { databaseId, tableId, fieldId, fieldValue } = propsValue;
		const apiKey = auth.secret_text;
		const table = await softrClient.getTable({ apiKey, databaseId, tableId });
		const field = softrSearch.resolveField({ fields: table.fields, reference: fieldId });
		const condition = softrSearch.buildCondition({ field, operator: 'IS', value: fieldValue });

		const response = await softrRecords.searchRecords({
			apiKey,
			databaseId,
			tableId,
			body: {
				paging: { offset: 0, limit: 1 },
				filter: { condition: { operator: 'AND', conditions: [condition] } },
			},
		});

		const foundRecord = response.data?.[0];
		if (!foundRecord) {
			return { found: false, data: {} };
		}
		return {
			found: true,
			data: softrClient.withFieldNames({ record: foundRecord, tableFields: table.fields }),
		};
	},
});
