import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import {
	createAction,
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';
import { isEmpty, MarkdownVariant } from '@activepieces/shared';
import { Client } from '@microsoft/microsoft-graph-client';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';

const createEmptyOptions = (message: string) => {
	return {
		placeholder: message,
		options: [],
		disabled: true,
	};
};

export enum FilterOperator {
	TEXT_CONTAINS = 'TEXT_CONTAINS',
	TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
	TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
	TEXT_DOES_NOT_EXACTLY_MATCH = 'TEXT_DOES_NOT_EXACTLY_MATCH',
	TEXT_STARTS_WITH = 'TEXT_START_WITH',
	TEXT_DOES_NOT_START_WITH = 'TEXT_DOES_NOT_START_WITH',
	TEXT_ENDS_WITH = 'TEXT_ENDS_WITH',
	TEXT_DOES_NOT_END_WITH = 'TEXT_DOES_NOT_END_WITH',
	TEXT_MATCHES_ANY_OF = 'TEXT_MATCHES_ANY_OF',
	TEXT_MATCHES_NONE_OF = 'TEXT_MATCHES_NONE_OF',
	NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
	NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
	NUMBER_IS_EQUAL_TO = 'NUMBER_IS_EQUAL_TO',
	BOOLEAN_IS_TRUE = 'BOOLEAN_IS_TRUE',
	BOOLEAN_IS_FALSE = 'BOOLEAN_IS_FALSE',
	DATE_IS_BEFORE = 'DATE_IS_BEFORE',
	DATE_IS_EQUAL = 'DATE_IS_EQUAL',
	DATE_IS_AFTER = 'DATE_IS_AFTER',
	LIST_CONTAINS = 'LIST_CONTAINS',
	LIST_DOES_NOT_CONTAIN = 'LIST_DOES_NOT_CONTAIN',
	LIST_IS_EMPTY = 'LIST_IS_EMPTY',
	LIST_IS_NOT_EMPTY = 'LIST_IS_NOT_EMPTY',
	EXISTS = 'EXISTS',
	DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}

export const appendMultipleRowsAction = createAction({
	auth: excelAuth,
	name: 'append_multiple_rows',
	description: 'Appends multiple row of values to a worksheet.',
	displayName: 'Append Multiple Rows',
	props: {
		workbook_id: excelCommon.workbook_id,
		worksheet_id: excelCommon.worksheet_id,
		values: Property.DynamicProperties({
			auth: excelAuth,
			displayName: 'Values',
			required: true,
			refreshers: ['workbook_id', 'worksheet_id'],
			props: async ({ auth, workbook_id, worksheet_id }) => {
				if (
					!auth ||
					(workbook_id ?? '').toString().length === 0 ||
					(worksheet_id ?? '').toString().length === 0
				) {
					return {};
				}

				const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;

				const firstRow = await excelCommon.getHeaders(
					workbook_id as unknown as string,
					authProp['access_token'],
					worksheet_id as unknown as string,
				);

				const fields: DynamicPropsValue = {};

				const columns: {
					[key: string]: any;
				} = {};
				for (const key in firstRow) {
					columns[key] = Property.ShortText({
						displayName: firstRow[key].toString(),
						description: firstRow[key].toString(),
						required: false,
						defaultValue: '',
					});
				}

				fields['values'] = Property.Array({
					displayName: 'Values',
					required: true,
					properties: columns,
				});

				return fields;
			},
		}),
		filterMarkdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Use below Filter properties to insert only the rows that meet your conditions.`,
		}),
		filterColumn: Property.Dropdown({
			displayName: 'Filter Column',
			refreshers: ['workbook_id', 'worksheet_id'],
			auth: excelAuth,
			required: false,
			async options({ auth, worksheet_id, workbook_id }) {
				if (!auth) {
					return createEmptyOptions('please connect account first.');
				}
				if (!workbook_id) {
					return createEmptyOptions('please select workbook first.');
				}
				if (!worksheet_id) {
					return createEmptyOptions('please select worksheet first.');
				}

				const firstRow = await excelCommon.getHeaders(
					workbook_id as string,
					auth.access_token,
					worksheet_id as string,
				);

				const options: DropdownOption<string>[] = [];

				for (const key in firstRow) {
					if (isEmpty(firstRow[key])) continue;
					options.push({ value: key, label: firstRow[key].toString() });
				}

				return {
					disabled: false,
					options,
				};
			},
		}),
		filterType: Property.StaticDropdown({
			displayName: 'Filter Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: '(Text) Exactly matches',
						value: FilterOperator.TEXT_EXACTLY_MATCHES,
					},
					{
						label: '(Text) Does not exactly match',
						value: FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH,
					},
					{
						label: '(Text) Matches any of',
						value: FilterOperator.TEXT_MATCHES_ANY_OF,
					},
					{
						label: '(Text) Matches none of',
						value: FilterOperator.TEXT_MATCHES_NONE_OF,
					},
				],
			},
		}),
		filterValue: Property.DynamicProperties({
			displayName: 'Filter Value',
			refreshers: ['filterType'],
			auth: excelAuth,
			required: false,
			props: async ({ filterType }) => {
				if (!filterType) return {};

				const filterCondition = filterType as unknown as FilterOperator;

				const props: DynamicPropsValue = {};

				switch (filterCondition) {
					case FilterOperator.TEXT_EXACTLY_MATCHES:
					case FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH:
						props['value'] = Property.ShortText({
							displayName: 'Filter Value',
							required: false,
						});
						break;
					case FilterOperator.TEXT_MATCHES_ANY_OF:
					case FilterOperator.TEXT_MATCHES_NONE_OF:
						props['value'] = Property.Array({
							displayName: 'Filter Value',
							required: false,
						});
						break;
					default:
						break;
				}

				return props;
			},
		}),
	},
	async run({ propsValue, auth }) {
		const workbookId = propsValue['workbook_id'];
		const worksheetId = propsValue['worksheet_id'];
		const filterColumn = propsValue.filterColumn;
		const filterCondition = propsValue.filterType;
		const rawFilterValue = propsValue.filterValue?.['value'];
		const inputValues: Array<Record<string, any>> = propsValue.values['values'] ?? [];

		const firstRow = await excelCommon.getHeaders(
			workbookId as string,
			auth.access_token,
			worksheetId as string,
		);

		const columnCount = firstRow.length;

		let filteredRowValues = inputValues;

		if (filterColumn) {
			if (!filterCondition || !rawFilterValue) {
				throw new Error(
					'When a filter column is selected, filter condition and value are required.',
				);
			}

			const filterValues: string[] = Array.isArray(rawFilterValue)
				? rawFilterValue.map((v) => String(v).trim().toLowerCase())
				: rawFilterValue != null
				? [String(rawFilterValue).trim()]
				: [];

			filteredRowValues = inputValues.filter((row) => {
				if (!filterColumn) return true;

				const value = String(row[filterColumn] ?? '').trim();

				switch (filterCondition) {
					case FilterOperator.TEXT_EXACTLY_MATCHES:
						return value === filterValues[0];

					case FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH:
						return value !== filterValues[0];

					case FilterOperator.TEXT_MATCHES_ANY_OF:
						return filterValues.includes(value.toLowerCase());

					case FilterOperator.TEXT_MATCHES_NONE_OF:
						return !filterValues.includes(value.toLowerCase());

					default:
						return true;
				}
			});
		}

		const formattedValues = filteredRowValues.map((v) =>
			Array.from({ length: columnCount }, (_, i) => v[i] ?? null),
		);

		if (formattedValues.length === 0) {
			throw new Error('No rows to insert. The provided/filtered rows did not contain any values.');
		}

		const lastUsedRow = await excelCommon.getLastUsedRow(
			workbookId,
			worksheetId,
			auth['access_token'],
		);

		const lastUsedColumn = excelCommon.numberToColumnName(columnCount);

		const rangeFrom = `A${lastUsedRow + 1}`;
		const rangeTo = `${lastUsedColumn}${lastUsedRow + formattedValues.length}`;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const url = `/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`;

		const requestBody = {
			values: formattedValues,
		};

		const res: WorkbookRange = await client.api(url).update(requestBody);

		const {
			numberFormat,
			formulas,
			formulasLocal,
			formulasR1C1,
			valueTypes,
			values,
			text,
			...rest
		} = res;

		return rest;
	},
});
