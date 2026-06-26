import { googleSheetsAuth } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	Dimension,
	googleSheetsCommon,
	objectToArray,
	ValueInputOption,
	columnToLabel,
	areSheetIdsValid,
	createGoogleClient,
} from '../common/common';
import { getWorkSheetName, getWorkSheetGridSize } from '../triggers/helpers';
import { sheets as googleSheets, sheets_v4 } from '@googleapis/sheets';
import { parse } from 'csv-parse/sync';

type RowValueType = Record<string, any>;

export const sheetsAddMultipleRows = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_add_multiple_rows',
	displayName: 'Add Multiple Rows',
	description: 'Add multiple rows of data at once to a worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Bulk-appends many rows in one call from CSV, JSON, or per-column values, with optional overwrite or duplicate-skip keyed on a column. Use for batch inserts instead of repeated sheets_add_row; in default append mode it is not idempotent. Overwrite mode replaces the existing data block (assuming a header at row 1). JSON mode adds any missing columns to the header row. Duplicate matching is case-insensitive.',
		idempotent: false,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		sheet_id: Property.Number({
			displayName: 'Worksheet ID',
			description:
				'The numeric worksheet (tab) id. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		input_type: Property.StaticDropdown({
			displayName: 'Rows Data Format',
			description: 'Select the format of the input values to be added into the worksheet.',
			required: true,
			defaultValue: 'json',
			options: {
				disabled: false,
				options: [
					{ value: 'csv', label: 'CSV' },
					{ value: 'json', label: 'JSON' },
					{ value: 'column_names', label: 'Column Names' },
				],
			},
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'The rows to add. For "JSON": an array of objects keyed by header name, e.g. [{"Name":"a","Age":"1"}]. For "CSV": a CSV string whose first row is the headers. For "Column Names": an array of objects keyed by column letter, e.g. [{"A":"a","B":"1"}].',
			required: true,
		}),
		overwrite: Property.Checkbox({
			displayName: 'Overwrite Existing Data?',
			description:
				'Enable this option to replace all existing data in the sheet with new data from your input. This will clear any extra rows beyond the updated range.',
			required: false,
			defaultValue: false,
		}),
		check_for_duplicate: Property.Checkbox({
			displayName: 'Avoid Duplicates?',
			description:
				'Enable this option to check for duplicate values before inserting data into the sheet. Only unique rows will be added based on the selected column.',
			required: false,
			defaultValue: false,
		}),
		duplicate_column: Property.ShortText({
			displayName: 'Duplicate Value Column',
			description:
				'The column letter (e.g. "A") to check for duplicate values. Required when "Avoid Duplicates?" is on.',
			required: false,
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
		header_row: Property.Number({
			displayName: 'Header Row Number',
			description: 'The row number where your column headers are located (usually row 1).',
			required: true,
			defaultValue: 1,
		}),
	},

	async run(context) {
		const {
			spreadsheet_id: inputSpreadsheetId,
			sheet_id: inputSheetId,
			input_type: valuesInputType,
			overwrite: overwriteValues,
			check_for_duplicate: checkForDuplicateValues,
			values: rowValuesInput,
			as_string: asString,
			header_row: headerRow,
		} = context.propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const duplicateColumn = context.propsValue.duplicate_column;
		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

		const rowHeaders = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId: spreadsheetId,
			auth: context.auth,
			sheetId: sheetId,
			rowIndex_s: 1,
			rowIndex_e: 1,
			headerRow: headerRow,
		});

		const sheetHeaders = rowHeaders[0]?.values ?? {};

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const formattedValues = await formatInputRows(
			sheets,
			spreadsheetId,
			sheetName,
			valuesInputType,
			rowValuesInput,
			sheetHeaders,
		);

		const valueInputOption = asString ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED;

		if (overwriteValues) {
			const sheetGridRange = await getWorkSheetGridSize(context.auth, spreadsheetId, sheetId);
			const existingGridRowCount = sheetGridRange.rowCount ?? 0;
			return handleOverwrite(
				sheets,
				spreadsheetId,
				sheetName,
				formattedValues,
				existingGridRowCount,
				valueInputOption,
			);
		}

		if (checkForDuplicateValues) {
			const existingSheetValues = await googleSheetsCommon.getGoogleSheetRows({
				spreadsheetId: spreadsheetId,
				auth: context.auth,
				sheetId: sheetId,
				rowIndex_s: 1,
				rowIndex_e: undefined,
				headerRow: headerRow,
			});
			return handleDuplicates(
				sheets,
				spreadsheetId,
				sheetName,
				formattedValues,
				existingSheetValues,
				duplicateColumn as string,
				valueInputOption,
			);
		}

		return normalInsert(sheets, spreadsheetId, sheetName, formattedValues, valueInputOption);
	},
});

async function handleOverwrite(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	formattedValues: any[],
	existingGridRowCount: number,
	valueInputOption: ValueInputOption,
) {
	const existingRowCount = existingGridRowCount;
	const inputRowCount = formattedValues.length;

	const updateResponse = await sheets.spreadsheets.values.batchUpdate({
		spreadsheetId: spreadSheetId,
		requestBody: {
			data: [
				{
					range: `${sheetName}!A2:ZZZ${inputRowCount + 1}`,
					majorDimension: Dimension.ROWS,
					values: formattedValues.map((row) => objectToArray(row)),
				},
			],
			valueInputOption,
		},
	});

	// Determine if clearing rows is necessary and within grid size
	const clearStartRow = inputRowCount + 2; // Start clearing after the last input row
	const clearEndRow = Math.max(clearStartRow, existingRowCount);

	if (clearStartRow <= existingGridRowCount) {
		const boundedClearEndRow = Math.min(clearEndRow, existingGridRowCount);
		const clearRowsResponse = await sheets.spreadsheets.values.batchClear({
			spreadsheetId: spreadSheetId,
			requestBody: {
				ranges: [`${sheetName}!A${clearStartRow}:ZZZ${boundedClearEndRow}`],
			},
		});

		return {
			...updateResponse.data,
			...clearRowsResponse.data,
		};
	}
	return updateResponse.data;
}

async function handleDuplicates(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	formattedInputRows: any[],
	existingSheetValues: any[],
	duplicateColumn: string,
	valueInputOption: ValueInputOption,
) {
	const uniqueValues = formattedInputRows.filter(
		(inputRow) =>
			!existingSheetValues.some((existingRow) => {
				const existingValue = existingRow?.values?.[duplicateColumn];
				const inputValue = inputRow?.[duplicateColumn];
				return (
					existingValue != null &&
					inputValue != null &&
					String(existingValue).toLowerCase().trim() ===
						String(inputValue).toLowerCase().trim()
				);
			}),
	);

	const response = await sheets.spreadsheets.values.append({
		range: sheetName + '!A:A',
		spreadsheetId: spreadSheetId,
		valueInputOption,
		requestBody: {
			values: uniqueValues.map((row) => objectToArray(row)),
			majorDimension: Dimension.ROWS,
		},
	});

	return response.data;
}

async function normalInsert(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	formattedValues: any[],
	valueInputOption: ValueInputOption,
) {
	const response = await sheets.spreadsheets.values.append({
		range: sheetName + '!A:A',
		spreadsheetId: spreadSheetId,
		valueInputOption,
		requestBody: {
			values: formattedValues.map((row) => objectToArray(row)),
			majorDimension: Dimension.ROWS,
		},
	});
	return response.data;
}

async function formatInputRows(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	valuesInputType: string,
	rowValuesInput: any,
	sheetHeaders: RowValueType,
): Promise<RowValueType[]> {
	let formattedInputRows: any[] = [];

	switch (valuesInputType) {
		case 'csv':
			formattedInputRows = convertCsvToRawValues(rowValuesInput as string, ',', sheetHeaders);
			break;
		case 'json':
			formattedInputRows = await convertJsonToRawValues(
				sheets,
				spreadSheetId,
				sheetName,
				rowValuesInput as string,
				sheetHeaders,
			);
			break;
		case 'column_names':
			formattedInputRows = rowValuesInput as RowValueType[];
			break;
	}

	return formattedInputRows;
}

async function convertJsonToRawValues(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	json: string | Record<string, any>[],
	labelHeaders: RowValueType,
): Promise<RowValueType[]> {
	let data: RowValueType[];

	// If the input is a JSON string
	if (typeof json === 'string') {
		try {
			data = JSON.parse(json);
		} catch (error) {
			throw new Error('Invalid JSON format for row values');
		}
	} else {
		// If the input is already an array of objects, use it directly
		data = json;
	}

	// Ensure the input is an array of objects
	if (!Array.isArray(data) || typeof data[0] !== 'object') {
		throw new Error('Input must be an array of objects or a valid JSON string representing it.');
	}

	// Collect all possible headers from the data
	const allHeaders = new Set<string>();
	data.forEach((row) => {
		Object.keys(row).forEach((key) => allHeaders.add(key));
	});

	// Identify headers not present in labelHeaders
	const additionalHeaders = Array.from(allHeaders).filter(
		(header) => !Object.values(labelHeaders).includes(header),
	);

	//add missing headers to labelHeaders
	additionalHeaders.forEach((header) => {
		labelHeaders[columnToLabel(Object.keys(labelHeaders).length)] = header;
	});

	// update sheets with new headers
	if (additionalHeaders.length > 0) {
		await sheets.spreadsheets.values.update({
			range: `${sheetName}!A1:ZZZ1`,
			spreadsheetId: spreadSheetId,
			valueInputOption: ValueInputOption.USER_ENTERED,
			requestBody: {
				majorDimension: Dimension.ROWS,
				values: [objectToArray(labelHeaders)],
			},
		});
	}

	return data.map((row: RowValueType) => {
		return Object.entries(labelHeaders).reduce((acc, [labelColumn, csvHeader]) => {
			acc[labelColumn] = row[csvHeader] ?? '';
			return acc;
		}, {} as RowValueType);
	});
}

function convertCsvToRawValues(csvText: string, delimiter: string, labelHeaders: RowValueType) {
	// Split CSV into rows
	const rows: Record<string, any>[] = parse(csvText, {
		delimiter: delimiter,
		columns: true,
	});

	const result = rows.map((row) => {
		// Normalize record keys to lowercase
		const normalizedRow = Object.keys(row).reduce((acc, key) => {
			acc[key.toLowerCase().trim()] = row[key];
			return acc;
		}, {} as Record<string, any>);

		const transformedRow: Record<string, any> = {};
		for (const key in labelHeaders) {
			// Match labels to normalized keys
			const normalizedKey = labelHeaders[key].toLowerCase();
			transformedRow[key] = normalizedRow[normalizedKey] || '';
		}
		return transformedRow;
	});
	return result;
}
