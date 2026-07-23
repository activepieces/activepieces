import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import {
	areSheetIdsValid,
	createGoogleClient,
	Dimension,
	googleSheetsAuth,
	googleSheetsCommon,
	labelToColumn,
	mapRowsToHeaderNames,
	objectToArray,
	stringifyArray,
	ValueInputOption,
} from '../common/common';
import { getWorkSheetName, mapRowsToColumnLabels } from '../triggers/helpers';

export const sheetsFindOrCreateRow = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_find_or_create_row',
	displayName: 'Find or Create Row',
	description:
		'Look up a row by column value; if no match is found, create a new row with the provided values.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Looks up a row by a column value; if none matches, appends a new row with the provided values (returns created:true/false). Use to avoid duplicating a row keyed on a stable value. Idempotent — the wrapper returns the existing row instead of inserting a duplicate when the key already exists.',
		idempotent: true,
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
		column_name: Property.ShortText({
			displayName: 'Column',
			description:
				'The column letter to search in (e.g. "A", "B", "C"). Defaults to "A" if omitted.',
			required: false,
		}),
		search_value: Property.ShortText({
			displayName: 'Search Value',
			description: 'The value to look for in the selected column.',
			required: true,
		}),
		match_case: Property.Checkbox({
			displayName: 'Exact Match',
			description: 'Only treat exact matches as found.',
			required: true,
			defaultValue: false,
		}),
		header_row: Property.Number({
			displayName: 'Header Row',
			description: 'The row that contains the column names.',
			required: true,
			defaultValue: 1,
		}),
		use_header_names: Property.Checkbox({
			displayName: 'Use Column Names',
			description: 'Return found rows with header names as keys instead of A, B, C.',
			required: false,
			defaultValue: false,
		}),
		first_row_headers: Property.Checkbox({
			displayName: 'Values Keyed by Column Letter',
			description:
				'When true, "values" is an object keyed by column letter, e.g. {"A":"x","B":"y"}. When false, "values" is a positional array, e.g. ["x","y"] mapped to columns A, B, … in order.',
			required: true,
			defaultValue: false,
		}),
		as_string: Property.Checkbox({
			displayName: 'As String',
			description:
				'Inserted values that are dates and formulas will be entered as strings and have no effect.',
			required: false,
		}),
		values: Property.Json({
			displayName: 'Values',
			description:
				'The values to write when creating a new row. If "Values Keyed by Column Letter" is on, pass an object like {"A":"x","B":"y"}; otherwise pass an array like ["x","y"].',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const {
			spreadsheet_id: inputSpreadsheetId,
			sheet_id: inputSheetId,
			column_name,
			search_value,
			match_case,
			header_row,
			use_header_names,
			first_row_headers,
			as_string,
			values,
		} = propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const spreadsheetId = inputSpreadsheetId as string;
		const sheetId = Number(inputSheetId);
		const headerRow = header_row;

		const existingRows = await googleSheetsCommon.getGoogleSheetRows({
			spreadsheetId,
			auth,
			sheetId,
			rowIndex_s: 1,
			rowIndex_e: undefined,
			headerRow,
		});

		const columnLetter = column_name ?? 'A';
		const columnIndex = labelToColumn(columnLetter);

		const match = existingRows.find((row) => {
			const keys = Object.keys(row.values);
			if (keys.length <= columnIndex) return false;
			const cell = row.values[keys[columnIndex]];
			if (isNil(cell)) return false;
			const cellAsString = String(cell);
			return match_case
				? cellAsString === search_value
				: cellAsString.toLowerCase().includes(String(search_value).toLowerCase());
		});

		if (match) {
			const [mapped] = await mapRowsToHeaderNames(
				[match],
				use_header_names as boolean,
				spreadsheetId,
				sheetId,
				headerRow,
				auth,
			);
			return {
				found: true,
				created: false,
				...mapped,
			};
		}

		const sheetName = await getWorkSheetName(auth, spreadsheetId, sheetId);
		const authClient = await createGoogleClient(auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const formattedValues = first_row_headers
			? objectToArray(values as any).map((val) => (isNil(val) ? '' : val))
			: (values as unknown as unknown[]);

		const stringifiedValues = stringifyArray(formattedValues);

		const appendResponse = await sheets.spreadsheets.values.append({
			spreadsheetId,
			range: `${sheetName}!A:A`,
			valueInputOption: as_string ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED,
			requestBody: {
				majorDimension: Dimension.ROWS,
				values: [stringifiedValues],
			},
		});

		const updatedRange = appendResponse.data.updates?.updatedRange ?? '';
		const updatedRowNumber = extractRowNumber(updatedRange);

		const labeledCreatedRow = mapRowsToColumnLabels(
			[stringifiedValues],
			updatedRowNumber - 1,
			stringifiedValues.length,
		);
		const [createdMapped] = await mapRowsToHeaderNames(
			labeledCreatedRow,
			use_header_names as boolean,
			spreadsheetId,
			sheetId,
			headerRow,
			auth,
		);

		return {
			found: false,
			created: true,
			...createdMapped,
		};
	},
});

function extractRowNumber(updatedRange: string): number {
	const part = updatedRange.split('!')[1];
	if (!part) return 0;
	return parseInt(part.split(':')[0].substring(1), 10);
}
