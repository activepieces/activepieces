import { Property, createAction } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { isNil } from '@activepieces/pieces-framework';
import { areSheetIdsValid, createGoogleClient, Dimension, googleSheetsAuth } from '../common/common';

export const sheetsUpdateDimensionProperties = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_update_dimension_properties',
	displayName: 'Resize / Hide Rows or Columns',
	description: 'Set a fixed pixel size for rows/columns, or hide/unhide them.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sets a fixed pixel width/height for a range of columns/rows, or hides/unhides them. Use for an exact size (vs. content-fit via sheets_auto_resize_dimensions). Safe to retry — re-applying the same size/hidden state is a no-op.',
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
		dimension: Property.StaticDropdown({
			displayName: 'Dimension',
			description: 'Whether to act on columns (width) or rows (height).',
			required: true,
			defaultValue: Dimension.COLUMNS,
			options: {
				disabled: false,
				options: [
					{ label: 'Columns', value: Dimension.COLUMNS },
					{ label: 'Rows', value: Dimension.ROWS },
				],
			},
		}),
		start_index: Property.Number({
			displayName: 'Start Index (0-based)',
			description:
				'The first column/row to update, 0-based and inclusive. Column A / row 1 is index 0. The range is half-open: [start, end).',
			required: true,
		}),
		end_index: Property.Number({
			displayName: 'End Index (0-based, exclusive)',
			description:
				'The index just past the last column/row to update (exclusive). To update only column A use start 0, end 1.',
			required: true,
		}),
		pixel_size: Property.Number({
			displayName: 'Pixel Size',
			description: 'The fixed width (for columns) or height (for rows) in pixels. Leave empty to only change the hidden state.',
			required: false,
		}),
		hidden: Property.Checkbox({
			displayName: 'Hidden',
			description: 'Whether the rows/columns are hidden. Leave empty to only change the pixel size.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, sheet_id, dimension, start_index, end_index, pixel_size, hidden } =
			context.propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const properties: Record<string, unknown> = {};
		const fields: string[] = [];
		if (!isNil(pixel_size)) {
			properties['pixelSize'] = pixel_size;
			fields.push('pixelSize');
		}
		if (!isNil(hidden)) {
			properties['hiddenByUser'] = hidden;
			fields.push('hiddenByUser');
		}

		if (fields.length === 0) {
			throw new Error('Provide a pixel size and/or a hidden state to update.');
		}

		const authClient = await createGoogleClient(context.auth);
		const sheets = googleSheets({ version: 'v4', auth: authClient });

		const response = await sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			requestBody: {
				requests: [
					{
						updateDimensionProperties: {
							range: {
								sheetId: sheet_id,
								dimension,
								startIndex: start_index,
								endIndex: end_index,
							},
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
