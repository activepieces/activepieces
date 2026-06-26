import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { areSheetIdsValid, getAccessToken, googleSheetsAuth } from '../common/common';

export const sheetsExportWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_export_worksheet',
	displayName: 'Export Worksheet (CSV/TSV)',
	description: 'Download a worksheet as a CSV or TSV file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Exports one worksheet as a CSV or TSV file (returned as a file reference or raw text). Use to get a tab\'s contents in a flat delimited format for downstream processing or attachment. Read-only and safe to retry.',
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
				'The numeric worksheet (tab) id to export. Resolve via sheets_get_spreadsheet or sheets_find_worksheet. The first tab is usually 0.',
			required: true,
		}),
		format: Property.StaticDropdown({
			displayName: 'Export Format',
			description: 'Select the file type to export the sheet as.',
			required: true,
			defaultValue: 'csv',
			options: {
				disabled: false,
				options: [
					{ label: 'Comma Separated Values (.csv)', value: 'csv' },
					{ label: 'Tab Separated Values (.tsv)', value: 'tsv' },
				],
			},
		}),
		return_as_text: Property.Checkbox({
			displayName: 'Return as Text',
			description: 'Return the exported data as text instead of a file.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ propsValue, auth, files }) {
		const { spreadsheet_id, sheet_id, format, return_as_text } = propsValue;

		if (!areSheetIdsValid(spreadsheet_id, sheet_id)) {
			throw new Error('Please provide a spreadsheet id and worksheet id.');
		}

		const spreadsheetId = spreadsheet_id as string;
		const sheetId = sheet_id as number;

		const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${format}&id=${spreadsheetId}&gid=${sheetId}`;

		try {
			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: exportUrl,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: await getAccessToken(auth),
				},
				responseType: 'arraybuffer',
				followRedirects: true,
			});

			if (return_as_text) {
				const textData = Buffer.from(response.body).toString('utf-8');
				return {
					text: textData,
					format,
				};
			} else {
				const filename = `exported_sheet.${format}`;

				const file = await files.write({
					fileName: filename,
					data: Buffer.from(response.body),
				});

				return {
					file,
					filename,
					format,
				};
			}
		} catch (error) {
			throw new Error(`Failed to export sheet: ${error}`);
		}
	},
});
