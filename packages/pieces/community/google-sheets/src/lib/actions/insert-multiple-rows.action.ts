import { googleSheetsAuth } from '../../';
import {
	createAction,
	DropdownOption,
	DynamicPropsValue,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import { Dimension, googleSheetsCommon, objectToArray, ValueInputOption,columnToLabel, areSheetIdsValid } from '../common/common';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { getWorkSheetName, getWorkSheetGridSize } from '../triggers/helpers';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { isNil, MarkdownVariant } from '@activepieces/shared';
import {parse} from 'csv-parse/sync';
import { commonProps } from '../common/props';


type RowValueType = Record<string, any>

export const insertMultipleRowsAction = createAction({
	auth: googleSheetsAuth,
	name: 'google-sheets-insert-multiple-rows',
	displayName: 'Insert Multiple Rows',
	description: 'Add one or more new rows in a specific spreadsheet.',
	props: {
		...commonProps,
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
			refreshers: ['sheetId', 'spreadsheetId', 'input_type'],
			props: async ({ auth, sheetId, spreadsheetId, input_type }) => {
				const sheet_id = Number(sheetId);
				const spreadsheet_id = spreadsheetId as unknown as string;
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
						fields['markdown'] = Property.MarkDown({
							value: `Ensure the first row contains column headers that match the sheet's column names.`,
							variant: MarkdownVariant.INFO,
						});
						fields['values'] = Property.LongText({
							displayName: 'CSV',
							required: true,
						});
						break;
					case 'json':
						fields['markdown'] = Property.MarkDown({
							value: `Provide values in JSON format. Ensure the column names match the sheet's header.`,
							variant: MarkdownVariant.INFO,
						});
						fields['values'] = Property.Json({
							displayName: 'JSON',
							required: true,
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
						const headers = await googleSheetsCommon.getGoogleSheetRows({
							spreadsheetId: spreadsheet_id,
							accessToken: getAccessTokenOrThrow(authentication),
							sheetId: sheet_id,
							rowIndex_s: 1,
							rowIndex_e: 1,
						});
						const firstRow = headers[0].values ?? {};

						//check for empty headers
						if (Object.keys(firstRow).length === 0) {
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
			refreshers: ['spreadsheetId', 'sheetId', 'check_for_duplicate'],
			required: false,
			props: async ({ auth, spreadsheetId, sheetId, check_for_duplicate }) => {
				const sheet_id = Number(sheetId);
				const spreadsheet_id = spreadsheetId as unknown as string;
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
					const headers = await googleSheetsCommon.getGoogleSheetRows({
						spreadsheetId: spreadsheet_id,
						accessToken: getAccessTokenOrThrow(authentication),
						sheetId: sheet_id,
						rowIndex_s: 1,
						rowIndex_e: 1,
					});
					const firstRow = headers[0].values ?? {};

					//check for empty headers
					if (Object.keys(firstRow).length === 0) {
						fields['markdown'] = Property.MarkDown({
							value: `No headers were found in the selected spreadsheet or worksheet. Please ensure that headers are added to the sheet and refresh the page to display the available columns.`,
							variant: MarkdownVariant.INFO,
						});
					} else {
						const headers: DropdownOption<string>[] = [];
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
			spreadsheetId:inputSpreadsheetId,
			 sheetId:inputSheetId,
			input_type: valuesInputType,
			overwrite: overwriteValues,
			check_for_duplicate: checkForDuplicateValues,
			values: { values: rowValuesInput },
			as_string: asString,
		} = context.propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please select a spreadsheet and sheet first.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const duplicateColumn = context.propsValue.check_for_duplicate_column?.['column_name'];
		const sheetName = await getWorkSheetName(context.auth, spreadsheetId, sheetId);

		const rowHeaders = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId: spreadsheetId,
			accessToken: context.auth.access_token,
			sheetId: sheetId,
			rowIndex_s: 1,
			rowIndex_e: 1,
		});

		const sheetHeaders = rowHeaders[0]?.values ?? {};

		const authClient = new OAuth2Client();
		authClient.setCredentials(context.auth);
		const sheets = google.sheets({ version: 'v4', auth: authClient });

		const formattedValues = await formatInputRows(sheets,spreadsheetId, sheetName,valuesInputType, rowValuesInput, sheetHeaders);

		const valueInputOption = asString ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED;


		if (overwriteValues) {
			const sheetGridRange = await getWorkSheetGridSize(context.auth, spreadsheetId, sheetId);
			const existingGridRowCount = sheetGridRange.rowCount ?? 0;
			return handleOverwrite(sheets, spreadsheetId, sheetName, formattedValues, existingGridRowCount, valueInputOption);
		}

		if (checkForDuplicateValues) {
			const existingSheetValues = await googleSheetsCommon.getGoogleSheetRows({
				spreadsheetId: spreadsheetId,
				accessToken: context.auth.access_token,
				sheetId: sheetId,
				rowIndex_s: 1,
				rowIndex_e: undefined,
			});
			return handleDuplicates(
				sheets,
				spreadsheetId,
				sheetName,
				formattedValues,
				existingSheetValues,
				duplicateColumn,
				valueInputOption
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
	valueInputOption: ValueInputOption
) {
	const existingRowCount = existingGridRowCount;
	const inputRowCount = formattedValues.length;

	const updateResponse = await sheets.spreadsheets.values.batchUpdate({
		spreadsheetId: spreadSheetId,
		requestBody: {
			data: [{
				range: `${sheetName}!A2:ZZZ${inputRowCount + 1}`,
				majorDimension: Dimension.ROWS,
				values: formattedValues.map(row => objectToArray(row)),
			}],
			valueInputOption
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
	valueInputOption: ValueInputOption
) {

	const uniqueValues = formattedInputRows.filter(
		(inputRow) => !existingSheetValues.some(
			(existingRow) => {
				const existingValue = existingRow?.values?.[duplicateColumn];
				const inputValue = inputRow?.[duplicateColumn];
				return existingValue != null && inputValue != null &&
					String(existingValue).toLowerCase().trim() === String(inputValue).toLowerCase().trim();
			}
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
			values: formattedValues.map(row => objectToArray(row)),
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
	sheetHeaders: RowValueType
): Promise<RowValueType[]> {
	let formattedInputRows: any[] = [];

	switch (valuesInputType) {
		case 'csv':
			formattedInputRows = convertCsvToRawValues(rowValuesInput as string, ',', sheetHeaders);
			break;
		case 'json':
			formattedInputRows = await convertJsonToRawValues(sheets,spreadSheetId, sheetName, rowValuesInput as string, sheetHeaders);
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
	 labelHeaders: RowValueType
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
        (header) => !Object.values(labelHeaders).includes(header)
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
			majorDimension:Dimension.ROWS,
			values: [objectToArray(labelHeaders)]
		  }
		});
	  }

	return data.map((row: RowValueType) => {
		return Object.entries(labelHeaders).reduce((acc, [labelColumn, csvHeader]) => {
			acc[labelColumn] = row[csvHeader] ?? "";
			return acc;
		}, {} as RowValueType);

	})
}

function convertCsvToRawValues(
	csvText: string,
	delimiter: string,
	labelHeaders: RowValueType,
) {
	// Split CSV into rows
	const rows:Record<string,any>[] = parse(csvText,{delimiter: delimiter, columns: true});

	const result = rows.map((row)=>{
		// Normalize record keys to lowercase
		const normalizedRow = Object.keys(row).reduce((acc, key) => {
			acc[key.toLowerCase().trim()] = row[key];
			return acc;	
		},{} as Record<string,any>);

		const transformedRow :Record<string,any>= {};
		for(const key in labelHeaders){
			// Match labels to normalized keys
			const normalizedKey = labelHeaders[key].toLowerCase();
			transformedRow[key] = normalizedRow[normalizedKey] || '';
		}
		return transformedRow;
	})
	return result;
}
