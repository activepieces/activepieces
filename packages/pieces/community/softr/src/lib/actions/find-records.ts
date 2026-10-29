import { createAction, Property } from '@activepieces/pieces-framework';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { softrRecords } from '../common/records';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { SoftrCondition, softrSearch } from '../common/search';
import { TableField } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

const MAX_LIMIT = 200;

function readText(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	return typeof value === 'string' ? value : String(value);
}

function readConditions({ rawConditions, fields }: { rawConditions: unknown[]; fields: TableField[] }): SoftrCondition[] {
	return rawConditions.map((raw, index) => {
		if (typeof raw !== 'object' || raw === null) {
			throw new Error(`Condition ${index + 1} is not valid.`);
		}
		const fieldReference = 'field' in raw ? readText(raw.field) : undefined;
		const operator = 'operator' in raw ? readText(raw.operator) : undefined;
		if (!fieldReference || fieldReference.trim().length === 0) {
			throw new Error(`Condition ${index + 1} needs a field name or ID.`);
		}
		if (!operator || !softrSearch.operatorValues.includes(operator)) {
			throw new Error(`Condition ${index + 1} has an unsupported operator "${operator ?? ''}".`);
		}
		const field = softrSearch.resolveField({ fields, reference: fieldReference });
		return softrSearch.buildCondition({
			field,
			operator,
			value: 'value' in raw ? raw.value : undefined,
			upperBound: 'upperBound' in raw ? raw.upperBound : undefined,
		});
	});
}

function readWholeNumber({ value, name, min, max, fallback }: ReadNumberParams): number {
	if (value === undefined || value === null) {
		return fallback;
	}
	if (!Number.isInteger(value) || value < min || value > max) {
		throw new Error(`${name} must be a whole number between ${min} and ${max}.`);
	}
	return value;
}

export const findRecords = createAction({
	auth: SoftrAuth,
	name: 'findRecords',
	classification: 'SEARCH',
	displayName: 'Find Records',
	description: 'Finds records that match one or more conditions, with sorting and paging.',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches a Softr table with one or more conditions (equals, contains, greater than, between, one of, is empty, ...) joined by AND or OR, with optional sorting. Give fields by name or ID; leave conditions empty to list the whole table. For between, put the upper limit in Upper Bound; for one of, separate values with commas. Returns up to 200 records plus the total count; use Offset for the next page. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		conditions: Property.Array({
			displayName: 'Conditions',
			description: 'Each condition compares one field. Leave empty to return all records.',
			required: false,
			properties: {
				field: Property.ShortText({
					displayName: 'Field (name or ID)',
					required: true,
				}),
				operator: Property.StaticDropdown({
					displayName: 'Operator',
					required: true,
					defaultValue: 'IS',
					options: { options: softrSearch.operatorOptions },
				}),
				value: Property.ShortText({
					displayName: 'Value',
					description: 'Lower bound for "between". Dates: 2025-05-21 or PREDEFINED:TODAY.',
					required: false,
				}),
				upperBound: Property.ShortText({
					displayName: 'Upper Bound',
					description: 'Only for "Is between" and "Is not between".',
					required: false,
				}),
			},
		}),
		matchType: Property.StaticDropdown({
			displayName: 'Match',
			description: 'Whether records must match all conditions or any of them.',
			required: true,
			defaultValue: 'AND',
			options: {
				options: [
					{ label: 'All conditions (AND)', value: 'AND' },
					{ label: 'Any condition (OR)', value: 'OR' },
				],
			},
		}),
		sortField: Property.ShortText({
			displayName: 'Sort By Field (name or ID)',
			description: 'A field name or ID, or created_at / updated_at.',
			required: false,
		}),
		sortDirection: Property.StaticDropdown({
			displayName: 'Sort Direction',
			required: false,
			defaultValue: 'ASC',
			options: {
				options: [
					{ label: 'Ascending', value: 'ASC' },
					{ label: 'Descending', value: 'DESC' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of records to return (1-200).',
			required: false,
			defaultValue: 50,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			description: 'Number of matching records to skip, for paging through results.',
			required: false,
			defaultValue: 0,
		}),
	},
	outputSchema: softrOutputSchemas.findRecords,
	async run({ auth, propsValue }) {
		const { databaseId, tableId } = propsValue;
		const apiKey = auth.secret_text;
		const limit = readWholeNumber({ value: propsValue.limit, name: 'Limit', min: 1, max: MAX_LIMIT, fallback: 50 });
		const offset = readWholeNumber({
			value: propsValue.offset,
			name: 'Offset',
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
		const matchType = propsValue.matchType === 'OR' ? 'OR' : 'AND';
		const sortDirection = propsValue.sortDirection === 'DESC' ? 'DESC' : 'ASC';

		const table = await softrClient.getTable({ apiKey, databaseId, tableId });
		const conditions = readConditions({ rawConditions: propsValue.conditions ?? [], fields: table.fields });
		const sortReference = propsValue.sortField?.trim();
		const sortFieldId = sortReference ? softrSearch.resolveSortField({ fields: table.fields, reference: sortReference }) : undefined;

		const response = await softrRecords.searchRecords({
			apiKey,
			databaseId,
			tableId,
			body: {
				paging: { offset, limit },
				...(conditions.length > 0 ? { filter: { condition: { operator: matchType, conditions } } } : {}),
				...(sortFieldId ? { sorting: [{ sortingField: sortFieldId, sortType: sortDirection }] } : {}),
			},
		});

		const records = (response.data ?? []).map((record) =>
			softrClient.withFieldNames({ record, tableFields: table.fields }),
		);
		const total = response.metadata?.total ?? null;
		return {
			found: records.length > 0,
			count: records.length,
			total,
			offset,
			hasMore: total === null ? records.length === limit : offset + records.length < total,
			records,
		};
	},
});

type ReadNumberParams = {
	value: number | undefined | null;
	name: string;
	min: number;
	max: number;
	fallback: number;
};
