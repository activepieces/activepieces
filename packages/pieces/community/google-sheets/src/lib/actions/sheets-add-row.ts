import { createAction, Property } from '@activepieces/pieces-framework';
import {
	areSheetIdsValid,
	Dimension,
	getAccessToken,
	googleSheetsAuth,
	GoogleSheetsAuthValue,
	googleSheetsCommon,
	objectToArray,
	stringifyArray,
	ValueInputOption,
} from '../common/common';
import { isNil } from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';

export const sheetsAddRow = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_add_row',
	displayName: 'Add Row',
	description: 'Append a single new row to the end of a worksheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Appends a single new row to the end of a worksheet, mapping values to columns positionally or by header name. Use to record one new entry; for raw A1-array appends use sheets_append_values, for many rows at once use sheets_add_multiple_rows. Not idempotent — each call appends another row.',
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
				'The row values. If "Values Keyed by Column Letter" is on, pass an object like {"A":"x","B":"y"}; otherwise pass an array like ["x","y"].',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const {
			values,
			spreadsheet_id: inputSpreadsheetId,
			sheet_id: inputSheetId,
			as_string,
			first_row_headers,
		} = propsValue;

		if (!areSheetIdsValid(inputSpreadsheetId, inputSheetId)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const sheetId = Number(inputSheetId);
		const spreadsheetId = inputSpreadsheetId as string;

		const sheetName = await googleSheetsCommon.findSheetName(auth, spreadsheetId, sheetId);

		const formattedValues = first_row_headers
			? objectToArray(values as any).map((val) => (isNil(val) ? '' : val))
			: (values as unknown as unknown[]);

		const res = await appendGoogleSheetValues({
			auth,
			majorDimension: Dimension.COLUMNS,
			range: sheetName,
			spreadSheetId: spreadsheetId,
			valueInputOption: as_string ? ValueInputOption.RAW : ValueInputOption.USER_ENTERED,
			values: stringifyArray(formattedValues),
		});

		const updatedRowNumber = extractRowNumber(res.body.updates.updatedRange);
		return { ...res.body, row: updatedRowNumber };
	},
});

function extractRowNumber(updatedRange: string): number {
	const rowRange = updatedRange.split('!')[1];
	return parseInt(rowRange.split(':')[0].substring(1), 10);
}

async function appendGoogleSheetValues(params: AppendGoogleSheetValuesParams) {
	const { auth, majorDimension, range, spreadSheetId, valueInputOption, values } = params;
	const accessToken = await getAccessToken(auth);
	const request: HttpRequest = {
		method: HttpMethod.POST,
		url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadSheetId}/values/${encodeURIComponent(
			`${range}!A:A`,
		)}:append`,
		body: {
			majorDimension,
			range: `${range}!A:A`,
			values: values.map((val) => ({ values: val })),
		},
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		queryParams: {
			valueInputOption,
		},
	};

	return httpClient.sendRequest(request);
}

type AppendGoogleSheetValuesParams = {
	values: string[];
	spreadSheetId: string;
	range: string;
	valueInputOption: ValueInputOption;
	majorDimension: Dimension;
	auth: GoogleSheetsAuthValue;
};
