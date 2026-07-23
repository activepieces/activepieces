import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { isNil } from '@activepieces/pieces-framework';
import { areSheetIdsValid, createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsUpdateSheetProperties = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_update_sheet_properties',
	displayName: 'Update Worksheet Properties',
	description: 'Update a worksheet\'s frozen rows/columns, tab color, or hidden state.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a worksheet\'s structural properties: frozen row/column counts, tab color, or hidden state, via a fielded PATCH (rename is handled by sheets_rename_worksheet). Use to freeze headers or color/hide a tab. Safe to retry — re-applying the same values is a no-op.',
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
				'The numeric worksheet (tab) id (gid). Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		frozen_row_count: Property.Number({
			displayName: 'Frozen Row Count',
			description: 'Number of rows to freeze at the top (e.g. 1 to freeze a header row). Set 0 to unfreeze.',
			required: false,
		}),
		frozen_column_count: Property.Number({
			displayName: 'Frozen Column Count',
			description: 'Number of columns to freeze at the left. Set 0 to unfreeze.',
			required: false,
		}),
		tab_color: Property.ShortText({
			displayName: 'Tab Color',
			description: 'HEX color code for the tab, e.g. #FF0000.',
			required: false,
		}),
		hidden: Property.Checkbox({
			displayName: 'Hidden',
			description: 'Whether the worksheet tab is hidden.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, frozen_row_count, frozen_column_count, tab_color, hidden } =
			context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const properties: Record<string, unknown> = { sheetId: sheet_id };
		const fields: string[] = [];

		const gridProperties: Record<string, number> = {};
		if (!isNil(frozen_row_count)) {
			gridProperties['frozenRowCount'] = frozen_row_count;
			fields.push('gridProperties.frozenRowCount');
		}
		if (!isNil(frozen_column_count)) {
			gridProperties['frozenColumnCount'] = frozen_column_count;
			fields.push('gridProperties.frozenColumnCount');
		}
		if (Object.keys(gridProperties).length > 0) {
			properties['gridProperties'] = gridProperties;
		}
		if (!isNil(tab_color)) {
			properties['tabColor'] = hexToRgb(tab_color);
			fields.push('tabColor');
		}
		if (!isNil(hidden)) {
			properties['hidden'] = hidden;
			fields.push('hidden');
		}

		if (fields.length === 0) {
			throw new Error(
				'Provide at least one property to update (frozen rows/columns, tab color, or hidden).',
			);
		}

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			requestBody: {
				requests: [
					{
						updateSheetProperties: {
							properties,
							fields: fields.join(','),
						},
					},
				],
			},
		});

		return {
			success: true,
			...response.data,
		};
	},
});

function hexToRgb(hex?: string) {
	if (isNil(hex)) return undefined;
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				red: parseInt(result[1], 16) / 255,
				green: parseInt(result[2], 16) / 255,
				blue: parseInt(result[3], 16) / 255,
		  }
		: undefined;
}
