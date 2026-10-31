import { createAction, DynamicPropsValue, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';
import {
	createMSGraphClient,
	getHeaders,
	getLastUsedRow,
	numberToColumnName,
} from '../common/helpers';
import { commonProps } from '../common/props';
import { excelAuth } from '../auth';

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
	classification: 'WRITE',
	description: 'Append several rows to a worksheet.',
	audience: 'both',
	aiMetadata: { description: 'Append several rows of cell values to the bottom of a worksheet in one call, after the last used row. Use for bulk inserts into a plain (non-table) worksheet; for a defined Excel table use Append Rows to a Table instead. Not idempotent — re-running adds duplicate rows. Supports an optional filter to insert only rows whose chosen column matches/does not match a value.', idempotent: false },
	displayName: 'Append Multiple Rows',
	propertyGroups: [
		{
			key: 'workbook',
			display: 'section',
			label: 'Workbook',
			icon: 'file',
			props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
		},
		{
			key: 'rows',
			display: 'section',
			label: 'Rows',
			icon: 'text',
			props: ['values'],
		},
		{
			key: 'filter',
			display: 'section',
			label: 'Filter',
			icon: 'filter',
			props: ['filterMarkdown', 'filterColumn', 'filterType', 'filterValue'],
		},
	],
	props: {
		storageSource: commonProps.storageSource,
		siteId: commonProps.siteId,
		documentId: commonProps.documentId,
		workbookId: commonProps.workbookId,
		worksheetId: commonProps.worksheetId,
		values: commonProps.worksheetMultiValues,
		filterMarkdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: 'Optional. Only rows that pass the condition are written.',
		}),
		filterColumn: commonProps.filterColumn,
		filterType: Property.StaticDropdown({
			displayName: 'Condition',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Exactly matches',
						value: FilterOperator.TEXT_EXACTLY_MATCHES,
					},
					{
						label: 'Does not exactly match',
						value: FilterOperator.TEXT_DOES_NOT_EXACTLY_MATCH,
					},
					{
						label: 'Matches any of',
						value: FilterOperator.TEXT_MATCHES_ANY_OF,
					},
					{
						label: 'Matches none of',
						value: FilterOperator.TEXT_MATCHES_NONE_OF,
					},
				],
			},
		}),
		filterValue: Property.DynamicProperties({
			displayName: 'Value',
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
							displayName: 'Value',
							required: false,
						});
						break;
					case FilterOperator.TEXT_MATCHES_ANY_OF:
					case FilterOperator.TEXT_MATCHES_NONE_OF:
						props['value'] = Property.Array({
							displayName: 'Value',
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
		const {
			workbookId,
			worksheetId,
			storageSource,
			siteId,
			documentId,
			filterColumn,
			filterType: filterCondition,
		} = propsValue;
		const rawFilterValue = propsValue.filterValue?.['value'];
		const inputValues: Array<Record<string, any>> = propsValue.values['values'] ?? [];
		const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

		if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
			throw new Error('please select SharePoint site and document library.');
		}

		const drivePath =
			storageSource === 'onedrive' ? '/me/drive' : `/sites/${siteId}/drives/${documentId}`;

		const firstRow = await getHeaders(
			auth.access_token,
			drivePath,
			workbookId as unknown as string,
			worksheetId as unknown as string,
			cloud
		);

		const columnCount = firstRow.length;

		let filteredRowValues = inputValues;

		if (filterColumn) {
			if (!filterCondition || !rawFilterValue) {
				throw new Error(
					'When a filter column is selected, filter condition and value are required.'
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
			Array.from({ length: columnCount }, (_, i) => v[i] ?? null)
		);

		if (formattedValues.length === 0) {
			throw new Error(
				'No rows to insert. The provided/filtered rows did not contain any values.'
			);
		}

		const lastUsedRow = await getLastUsedRow(
			auth.access_token,
			drivePath,
			workbookId,
			worksheetId,
			cloud
		);

		const lastUsedColumn = numberToColumnName(columnCount);

		const rangeFrom = `A${lastUsedRow + 1}`;
		const rangeTo = `${lastUsedColumn}${lastUsedRow + formattedValues.length}`;

		const client = createMSGraphClient(auth.access_token, cloud);

		const url = `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`;

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
