import { googleSheetsAuth } from '../../';
import {
	createAction,
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import { Dimension, googleSheetsCommon, objectToArray, ValueInputOption } from '../common/common';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { getWorkSheetName } from '../triggers/helpers';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { MarkdownVariant } from '@activepieces/shared';

export const insertMultipleRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'google-sheets-insert-multiple-rows',
	displayName: 'Insert Multiple Rows',
	description: 'Add one or more new rows in a specific spreadsheet.',
	props: {
		spreadsheet_id: googleSheetsCommon.spreadsheet_id,
		include_team_drives: googleSheetsCommon.include_team_drives,
		sheet_id: googleSheetsCommon.sheet_id,
		input_type: Property.StaticDropdown({
			displayName: 'Rows Input Format',
			description: 'Select the format of the input values to be inserted into the sheet.',
			required: true,
			defaultValue: 'column_names',
			options: {
				disabled: false,
				options: [
					{
						value: 'csv',
						label: 'CSV',
					},
					{
						value: 'json',
						label: 'JSON',
					},
					{
						value: 'column_names',
						label: 'Column Names',
					},
				],
			},
		}),
		values: Property.DynamicProperties({
			displayName: 'Values',
			description: 'The values to insert.',
			required: true,
			refreshers: ['sheet_id', 'spreadsheet_id', 'input_type'],
			props: async ({ auth, sheet_id, spreadsheet_id, input_type }) => {
				const sheetId = Number(sheet_id);
				const spreadsheetId = spreadsheet_id as unknown as string;
				const valuesInputType = input_type as unknown as string;
				const authentication = auth as OAuth2PropertyValue;

				if (
					!auth ||
					(spreadsheet_id ?? '').toString().length === 0 ||
					(sheet_id ?? '').toString().length === 0 ||
					!['csv', 'json', 'column_names'].includes(valuesInputType)
				) {
					return {};
				}

				const fields: DynamicPropsValue = {};

				switch (valuesInputType) {
					case 'csv':
						fields['values'] = Property.LongText({
							displayName: 'CSV',
							required: true,
							description: "Provide values in CSV format. Ensure the first row contains column headers that match the sheet's column names.",
						});
						break;
					case 'json':
						fields['values'] = Property.Json({
							displayName: 'JSON',
							required: true,
							description: "Provide values in JSON format. Ensure the column names match the sheet's header.",
							defaultValue: [
								{
									column1: 'value1',
									column2: 'value2',
								},
								{
									column1: 'value3',
									column2: 'value4',
								},
							],
						});
						break;
					case 'column_names': {
						const values = await googleSheetsCommon.getValues(
							spreadsheetId,
							getAccessTokenOrThrow(authentication),
							sheetId,
						);
						const firstRow = values?.[0]?.values ?? [];

						//check for empty headers
						if (firstRow.length === 0) {
							fields['markdown'] = Property.MarkDown({
								value: `We couldn't find any headers in the selected spreadsheet or worksheet. Please add headers to the sheet and refresh the page to reflect the columns.`,
								variant: MarkdownVariant.INFO,
							});
						} else {
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
								required: false,
								properties: columns,
							});
						}
					}
				}
				return fields;
			},
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
		check_for_duplicate_column: Property.DynamicProperties({
			displayName: 'Duplicate Value Column',
			description: 'The column to check for duplicate values.',
			refreshers: ['spreadsheet_id', 'sheet_id', 'check_for_duplicate'],
			required: false,
			props: async ({ auth, spreadsheet_id, sheet_id, check_for_duplicate }) => {
				const sheetId = Number(sheet_id);
				const spreadsheetId = spreadsheet_id as unknown as string;
				const authentication = auth as OAuth2PropertyValue;
				const checkForExisting = check_for_duplicate as unknown as boolean;
				if (
					!auth ||
					(spreadsheet_id ?? '').toString().length === 0 ||
					(sheet_id ?? '').toString().length === 0
				) {
					return {};
				}

				const fields: DynamicPropsValue = {};

				if (checkForExisting) {
					const values = await googleSheetsCommon.getValues(
						spreadsheetId,
						getAccessTokenOrThrow(authentication),
						sheetId,
					);
					const firstRow = values?.[0]?.values ?? [];
					const headers: DropdownOption<string>[] = [];

					//check for empty headers
					if (firstRow.length === 0) {
						fields['markdown'] = Property.MarkDown({
							value: `No headers were found in the selected spreadsheet or worksheet. Please ensure that headers are added to the sheet and refresh the page to display the available columns.`,
							variant: MarkdownVariant.INFO,
						});
					} else {
						for (const key in firstRow) {
							headers.push({ label: firstRow[key].toString(), value: key.toString() });
						}

						fields['column_name'] = Property.StaticDropdown({
							displayName: 'Column to Check for Duplicates',
							description:
								'Select the column to use for detecting duplicate values. Only rows with unique values in this column will be added to the sheet.',
							required: true,
							options: {
								disabled: false,
								options: headers,
							},
						});
					}
				}

				return fields;
			},
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect',
			required: false,
		}),
	},

	async run(context) {
		const {
			spreadsheet_id: spreadSheetId,
			sheet_id: sheetId,
			input_type: valuesInputType,
			overwrite: overwriteValues,
			check_for_duplicate: checkForDuplicateValues,
			values: { values: rowValuesInput },
			as_string: asString,
		} = context.propsValue;

		const duplicateColumn = context.propsValue.check_for_duplicate_column?.['column_name'];
		const sheetName = await getWorkSheetName(context.auth, spreadSheetId, sheetId);
		const existingSheetValues = await googleSheetsCommon.getValues(
			spreadSheetId,
			context.auth.access_token,
			sheetId,
		);
		const sheetHeaders = existingSheetValues?.[0]?.values ?? {};

		const formattedValues = formatInputRows(valuesInputType, rowValuesInput, sheetHeaders);
		const valueInputOption = asString ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED;

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		if (overwriteValues) {
			return handleOverwrite(sheets, spreadSheetId, sheetName, formattedValues, existingSheetValues, valueInputOption);
		}

		if (checkForDuplicateValues) {
			return handleDuplicates(
				sheets,
				spreadSheetId,
				sheetName,
				formattedValues,
				existingSheetValues,
				duplicateColumn,
				valueInputOption
			);
		}

		return normalInsert(sheets, spreadSheetId, sheetName, formattedValues, valueInputOption);
	},
});

async function handleOverwrite(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	formattedValues: any[],
	existingSheetValues: any[],
	valueInputOption: ValueInputOption
) {
	const existingRowCount = existingSheetValues.length;
	const inputRowCount = formattedValues.length;

	const updateResponse = await sheets.spreadsheets.values.batchUpdate({
		spreadsheetId: spreadSheetId,
		requestBody: {
			data: [{
				range: `${sheetName}!A2:ZZZ${inputRowCount + 1}`,
				majorDimension: Dimension.ROWS,
				values: formattedValues,
			}],
			valueInputOption
		},
	});

	const clearRowsResponse = await sheets.spreadsheets.values.batchClear({
		spreadsheetId: spreadSheetId,
		requestBody: {
			ranges: [`${sheetName}!A${inputRowCount + 2}:ZZZ${Math.max(inputRowCount + 2, existingRowCount)}`],
		},
	});

	return {
		...updateResponse.data,
		...clearRowsResponse.data,
	};
}

async function handleDuplicates(
	sheets: sheets_v4.Sheets,
	spreadSheetId: string,
	sheetName: string,
	formattedInputRows: any[],
	existingSheetValues: any[],
	duplicateColumn: string,
	valueInputOption: ValueInputOption
) {
	const uniqueValues = formattedInputRows.filter(
		(inputRow) => !existingSheetValues.some(
			(existingRow) => existingRow.values[duplicateColumn] === inputRow[duplicateColumn]
		)
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
	valueInputOption: ValueInputOption
) {
	const response = await sheets.spreadsheets.values.append({
		range: sheetName + '!A:A',
		spreadsheetId: spreadSheetId,
		valueInputOption,
		requestBody: {
			values: formattedValues,
			majorDimension: Dimension.ROWS,
		},
	});
	return response.data;
}

function formatInputRows(
	valuesInputType: string,
	rowValuesInput: any,
	sheetHeaders: Record<string, any>
): any[] {
	let formattedInputRows: any[] = [];

	switch (valuesInputType) {
		case 'csv':
			formattedInputRows = convertCsvToRawValues(rowValuesInput as string, ',', sheetHeaders);
			break;
		case 'json':
			formattedInputRows = convertJsonToRawValues(rowValuesInput as string, sheetHeaders);
			break;
		case 'column_names':
			formattedInputRows = rowValuesInput as any[];
			break;
	}

	/*
	convert the input values to json format
	[ 
		{ 'A':'value1', 'B':'value2' },
		{ 'A':'value3', 'B':'value4' },
	]
	*/
	return formattedInputRows.map(row => objectToArray(row));
}

function convertJsonToRawValues(json: string | any[], labelHeaders: Record<string, any>): any[] {

	let data: Record<string, any>[];

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

	return data.map((row: Record<string, any>) => {
		return Object.entries(labelHeaders).reduce((acc, [labelColumn, csvHeader]) => {
			acc[labelColumn] = row[csvHeader] ?? "";
			return acc;
		}, {} as Record<string, any>);

	})
}

function convertCsvToRawValues(
	csvText: string,
	delimiter: string,
	labelHeaders: Record<string, any>,
) {
	// Split CSV into rows
	const rows = csvText.trim().split('\n');

	// Extract the input headers from the first row
	const headers = rows[0].split(delimiter);

	// Create a mapping of input headers to existing label names like "A", "B", "C", etc.
	const newHeaders = Object.entries(labelHeaders).reduce((acc, [labelColumn, csvHeader]) => {
		const index = headers.findIndex(header => header.toLocaleLowerCase() === csvHeader?.toLocaleLowerCase()?.trim());
		if (index > -1) acc[index] = labelColumn;
		return acc;
	}, [] as string[]);

	// Process each row of data and map it to the new labeled headers
	const result = rows.slice(1).map((row) => {
		const values = row.split(delimiter);
		return newHeaders.reduce((obj, header, index) => {
			obj[header] = values[index] ?? "";
			return obj;
		}, {} as Record<string, any>);
	});

	return result;
}
