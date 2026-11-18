import { Property, createAction } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { smartSuiteApi } from '../common';
import { smartSuiteClient } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { outputSchemas } from '../output-schemas';

const HARD_MAX_RECORDS = 10_000;

export const findRecords = createAction({
	name: 'find_records',
	classification: 'SEARCH',
	displayName: 'Find Records',
	description: 'Searches for records in the specified table based on criteria.',
	audience: 'human',
	aiMetadata: {
		description: 'Finds SmartSuite records where one chosen field equals a value, keyed by field label. Agents should use List Records (by Table ID) with a filter instead. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		searchField: smartsuiteCommon.tableFieldDropdown({ displayName: 'Search Field', required: true }),
		searchValue: Property.ShortText({
			displayName: 'Search Value',
			required: true,
		}),
		maxRecords: Property.Number({
			displayName: 'Max Records',
			description: `Stop after this many matches (1-${HARD_MAX_RECORDS}). Leave empty to return all matches up to ${HARD_MAX_RECORDS}; Has More tells you if more exist.`,
			required: false,
		}),
	},
	outputSchema: outputSchemas['findRecords'],
	async run({ auth, propsValue }) {
		const { tableId, searchField, searchValue } = propsValue;
		const maxRecords = smartSuiteInputs.integerInRange({
			value: propsValue.maxRecords,
			label: 'Max Records',
			min: 1,
			max: HARD_MAX_RECORDS,
			fallback: HARD_MAX_RECORDS,
		});
		const field = smartSuiteInputs.requireText({ value: searchField, label: 'Search Field' });
		const credentials = smartSuiteClient.credentialsOf(auth);
		const table = await smartSuiteApi.getTable({ credentials, tableId });
		const { items, hasMore } = await smartSuiteApi.collectRecords({
			credentials,
			tableId,
			filter: {
				operator: 'and',
				fields: [{ field, comparison: 'is', value: searchValue }],
			},
			maxRecords,
		});
		return {
			found: items.length > 0,
			result: items.map((record) => transformRecordFields({ tableSchema: table.structure, tableValues: record })),
			hasMore,
		};
	},
});
