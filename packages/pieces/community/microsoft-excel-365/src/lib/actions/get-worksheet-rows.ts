import {
	createAction,
	DropdownOption,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import {
	httpClient,
	HttpMethod,
	AuthenticationType,
} from '@activepieces/pieces-common';
import { excelCommon } from '../common/common';
import { excelAuth } from '../../index';
import { FilterOperator, filterOperatorLabels } from '../common/constants';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

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

		let url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

		if (!range) {
			url += 'usedRange(valuesOnly=true)';
		} else {
			url += `range(address = '${range}')`;
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: url,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth['access_token'],
			},
		});

		const rows = response.body['values'] as any[][];

		const filters = (filterConfig['filter'] as ColumnFilter[]) ?? [];

		const filteredRows = shouldApplyFilter
			? rows.filter((row) => evaluateFilters(filters, row))
			: rows;

		console.log(JSON.stringify(propsValue,null,2))

		// let filterRows: any[][] = [];
		// if (shouldApplyFilter) {
		// 	const filters = (filterListInput['filter'] as Array<ColumnFilter>) ?? [];
		// 	for (const row of rows) {
		// 		const filterConditionFinalValue = evaluteFilters(filters, row);
		// 		if (filterConditionFinalValue) filterRows.push(row);
		// 	}
		// } else {
		// 	filterRows = rows;
		// }


		if (headerRow && firstDataRow) {
			return filteredRows.slice(firstDataRow - 1).map((row: any[]) => {
				const obj: { [key: string]: any } = {};
				rows[headerRow - 1].forEach(
					(header: any, colIndex: string | number) => {
						obj[String(header)] = row[Number(colIndex)];
					}
				);
				return obj;
			});
		}

		return rows;
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

// function evaluteFilters(
// 	columnFilters: Array<ColumnFilter>,
// 	row: any[]
// ): boolean {
// 	let andCondition = true;
// 	for (const condition of columnFilters) {
// 		const { filterColumn, filterOperator, filterValue } = condition;

// 		if (isNil(filterColumn) || isNil(filterOperator) || isNil(filterValue))
// 			continue;

// 		const cellValue = row[filterColumn];

// 		switch (filterOperator) {
// 			case FilterOperator.TEXT_CONTAINS: {
// 				const firstValueContains = String(cellValue)
// 					.toLowerCase()
// 					.includes(filterValue.toLowerCase());
// 				andCondition = andCondition && firstValueContains;
// 				break;
// 			}
// 			case FilterOperator.TEXT_DOES_NOT_CONTAIN: {
// 				const firstValueDoesNotContain = !String(cellValue)
// 					.toLowerCase()
// 					.includes(filterValue.toLowerCase());
// 				andCondition = andCondition && firstValueDoesNotContain;
// 				break;
// 			}
// 			case FilterOperator.TEXT_EXACTLY_MATCHES: {
// 				const firstValueExactlyMatches =
// 					String(cellValue).toLowerCase() === filterValue.toLowerCase();
// 				andCondition = andCondition && firstValueExactlyMatches;
// 				break;
// 			}
// 			case FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH: {
// 				const firstValueDoesNotExactlyMatch =
// 					String(cellValue).toLowerCase() !== filterValue.toLowerCase();
// 				andCondition = andCondition && firstValueDoesNotExactlyMatch;
// 				break;
// 			}
// 			case FilterOperator.NUMBER_IS_GREATER_THAN: {
// 				const firstValue = parseStringToNumber(cellValue);
// 				const secondValue = parseStringToNumber(filterValue);
// 				andCondition = andCondition && firstValue > secondValue;
// 				break;
// 			}
// 			case FilterOperator.NUMBER_IS_LESS_THAN: {
// 				const firstValue = parseStringToNumber(cellValue);
// 				const secondValue = parseStringToNumber(filterValue);
// 				andCondition = andCondition && firstValue < secondValue;
// 				break;
// 			}
// 			case FilterOperator.NUMBER_IS_EQUAL_TO: {
// 				const firstValue = parseStringToNumber(cellValue);
// 				const secondValue = parseStringToNumber(filterValue);
// 				andCondition = andCondition && firstValue == secondValue;
// 				break;
// 			}
// 			case FilterOperator.DATE_IS_AFTER:
// 				andCondition =
// 					andCondition &&
// 					isValidDate(cellValue) &&
// 					isValidDate(filterValue) &&
// 					dayjs(cellValue).isAfter(dayjs(filterValue));
// 				break;
// 			case FilterOperator.DATE_IS_EQUAL:
// 				andCondition =
// 					andCondition &&
// 					isValidDate(cellValue) &&
// 					isValidDate(filterValue) &&
// 					dayjs(cellValue).isSame(dayjs(filterValue));
// 				break;
// 			case FilterOperator.DATE_IS_BEFORE:
// 				andCondition =
// 					andCondition &&
// 					isValidDate(cellValue) &&
// 					isValidDate(filterValue) &&
// 					dayjs(cellValue).isBefore(dayjs(filterValue));
// 				break;
// 		}
// 	}

// 	return Boolean(andCondition);
// }

// function parseStringToNumber(str: string): number | string {
// 	const num = Number(str);
// 	return isNaN(num) ? str : num;
// }
