import {
	createAction,
	DropdownOption,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../../index';
import { FilterOperator, filterOperatorLabels } from '../common/constants';
import { Client } from '@microsoft/microsoft-graph-client';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const getWorksheetRowsAction = createAction({
	auth: excelAuth,
	name: 'get_worksheet_rows',
	description: 'Retrieve rows from a worksheet',
	displayName: 'Get Worksheet Rows',
	props: {
		workbook_id: excelCommon.workbook_id,
		worksheet_id: excelCommon.worksheet_id,
		range: Property.ShortText({
			displayName: 'Range',
			description: 'Range of the rows to retrieve (e.g., A2:B2)',
			required: false,
		}),
		headerRow: Property.Number({
			displayName: 'Header Row',
			description: 'Row number of the header',
			required: false,
		}),
		firstDataRow: Property.Number({
			displayName: 'First Data Row',
			description: 'Row number of the first data row',
			required: false,
		}),
		useFilter: Property.Checkbox({
			displayName: 'Use Filters ?',
			description: 'Enables the column wise filter.',
			required: false,
			defaultValue: false,
		}),
		filterList: Property.DynamicProperties({
			displayName: 'Filter',
			refreshers: ['workbook_id', 'worksheet_id', 'useFilter'],
			required: false,
			auth: excelAuth,
			props: async ({ auth, useFilter, worksheet_id, workbook_id }) => {
				if (!auth || !useFilter || !workbook_id || !worksheet_id) return {};

				const fields: DynamicPropsValue = {};

				const firstRow = await excelCommon.getHeaders(
					workbook_id as unknown as string,
					auth['access_token'],
					worksheet_id as unknown as string
				);

				const filterColumnOptions: DropdownOption<number>[] = firstRow.map(
					(header, index) => ({
						label: header as string,
						value: index,
					})
				);

				const filterOperatorOptions: DropdownOption<string>[] = Object.entries(
					filterOperatorLabels
				).map(([operator, label]) => ({
					label,
					value: operator as string,
				}));

				fields['filter'] = Property.Array({
					displayName: 'Filter',
					required: false,
					properties: {
						filterColumn: Property.StaticDropdown({
							displayName: 'Filter Column',
							required: false,
							options: {
								disabled: false,
								options: filterColumnOptions,
							},
						}),
						filterOperator: Property.StaticDropdown({
							displayName: 'Filter Operator',
							required: false,
							options: {
								disabled: false,
								options: filterOperatorOptions,
							},
						}),
						filterValue: Property.ShortText({
							displayName: 'Filter Value',
							required: false,
						}),
					},
				});

				return fields;
			},
		}),
	},
	async run({ propsValue, auth }) {
		const workbookId = propsValue['workbook_id'];
		const worksheetId = propsValue['worksheet_id'];
		const range = propsValue['range'];
		const headerRow = propsValue['headerRow'];
		const firstDataRow = propsValue['firstDataRow'];
		const shouldApplyFilter = propsValue['useFilter'];
		const filterConfig = propsValue['filterList'] ?? {};

		let url = `/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

		if (!range) {
			url += 'usedRange(valuesOnly=true)';
		} else {
			url += `range(address = '${range}')`;
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const response: WorkbookRange = await client.api(url).get();

		const rows = response.text as any[][];
		if (!rows || rows.length === 0) return [];

		const filters = (filterConfig['filter'] as ColumnFilter[]) ?? [];
		const hasFilters = shouldApplyFilter && filters.length > 0;

		const headerIdx = headerRow ? headerRow - 1 : -1;
		const dataStartIdx = firstDataRow ? firstDataRow - 1 : 0;
		const headers = headerIdx >= 0 ? rows[headerIdx] : null;

		const result = [];

		for (let i = dataStartIdx; i < rows.length; i++) {
			const row = rows[i];

			if (hasFilters && !evaluateFilters(filters, row)) {
				continue;
			}
			if (headers) {
				const obj: { [key: string]: any } = {};
				for (let j = 0; j < headers.length; j++) {
					obj[String(headers[j])] = row[j];
				}
				result.push(obj);
			}
			else{
				result.push(row);
			}
		}

		return result;
	},
});

type ColumnFilter = {
	filterColumn?: number;
	filterOperator?: FilterOperator;
	filterValue?: string;
};

function evaluateFilters(filters: ColumnFilter[], row: any[]): boolean {
	return filters.every((filter) => {
		const {
			filterColumn: columnIndex,
			filterOperator: operator,
			filterValue: value,
		} = filter;

		if (columnIndex === undefined || !operator || value === undefined) {
			return true;
		}

		const cellValue = row[columnIndex];

		switch (operator) {
			case FilterOperator.TEXT_CONTAINS:
				return containsText(cellValue, value);

			case FilterOperator.TEXT_DOES_NOT_CONTAIN:
				return !containsText(cellValue, value);

			case FilterOperator.TEXT_EXACTLY_MATCHES:
				return equalsText(cellValue, value);

			case FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH:
				return !equalsText(cellValue, value);

			case FilterOperator.NUMBER_IS_GREATER_THAN:
				return toNumber(cellValue) > toNumber(value);

			case FilterOperator.NUMBER_IS_LESS_THAN:
				return toNumber(cellValue) < toNumber(value);

			case FilterOperator.NUMBER_IS_EQUAL_TO:
				return toNumber(cellValue) === toNumber(value);

			case FilterOperator.DATE_IS_AFTER:
				return isAfterDate(cellValue, value);

			case FilterOperator.DATE_IS_EQUAL:
				return isSameDate(cellValue, value);

			case FilterOperator.DATE_IS_BEFORE:
				return isBeforeDate(cellValue, value);

			case FilterOperator.DATE_IS_ON_OR_AFTER:
				return isSameOrAfterDate(cellValue, value);

			case FilterOperator.DATE_IS_ON_OR_BEFORE:
				return isSameOrBeforeDate(cellValue, value);

			default:
				return true;
		}
	});
}
function containsText(value: any, search: string): boolean {
	return String(value).toLowerCase().includes(search.toLowerCase());
}

function equalsText(value: any, search: string): boolean {
	return String(value).toLowerCase() === search.toLowerCase();
}

function toNumber(value: string): number | string {
	const num = Number(value);
	return isNaN(num) ? value : num;
}

function isValidDate(date: unknown): boolean {
	if (
		typeof date === 'string' ||
		typeof date === 'number' ||
		date instanceof Date
	) {
		return dayjs(date).isValid();
	}
	return false;
}

function isAfterDate(a: any, b: any): boolean {
	return isValidDate(a) && isValidDate(b) && dayjs(a).isAfter(dayjs(b));
}

function isSameDate(a: any, b: any): boolean {
	return isValidDate(a) && isValidDate(b) && dayjs(a).isSame(dayjs(b));
}

function isBeforeDate(a: any, b: any): boolean {
	return isValidDate(a) && isValidDate(b) && dayjs(a).isBefore(dayjs(b));
}

function isSameOrAfterDate(a: any, b: any): boolean {
	return isValidDate(a) && isValidDate(b) && dayjs(a).isSameOrAfter(dayjs(b));
}

function isSameOrBeforeDate(a: any, b: any): boolean {
	return isValidDate(a) && isValidDate(b) && dayjs(a).isSameOrBefore(dayjs(b));
}
