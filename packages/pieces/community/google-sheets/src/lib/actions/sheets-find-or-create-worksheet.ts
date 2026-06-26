import { createAction, Property } from '@activepieces/pieces-framework';
import { sheets as googleSheets } from '@googleapis/sheets';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsFindOrCreateWorksheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_find_or_create_worksheet',
	displayName: 'Find or Create Worksheet',
	description:
		'Look up a worksheet by title in a spreadsheet; if not found, create it with optional headers.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Looks up a worksheet by exact title; if not found, creates it with optional headers (returns created:true/false). Use to ensure a named tab exists without duplicating it. Idempotent — returns the existing tab when the title already matches.',
		idempotent: true,
	},
	props: {
		spreadsheet_id: Property.ShortText({
			displayName: 'Spreadsheet ID',
			description:
				'The ID of the spreadsheet (the Drive file id). Resolve from a name with sheets_search_spreadsheets.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Worksheet Title',
			description: 'The title to look up. The match is exact and case-sensitive.',
			required: true,
		}),
		headers: Property.Array({
			displayName: 'Headers (Only Used When Creating)',
			description: 'Column headers to add to the new worksheet if it has to be created.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_id, title } = context.propsValue;
		const headers = (context.propsValue.headers as string[]) ?? [];

		const authClient = await createGoogleClient(context.auth);
		const sheetsApi = googleSheets({ version: 'v4', auth: authClient });

		const existing = await sheetsApi.spreadsheets.get({ spreadsheetId: spreadsheet_id });
		const found = existing.data.sheets?.find((sheet) => sheet.properties?.title === title);

		if (found) {
			return {
				found: true,
				created: false,
				worksheet: found.properties,
			};
		}

		const addSheetResponse = await sheetsApi.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet_id,
			requestBody: {
				requests: [
					{
						addSheet: {
							properties: { title },
						},
					},
				],
			},
		});

		const newSheetProperties =
			addSheetResponse.data.replies?.[0]?.addSheet?.properties ?? undefined;

		if (headers.length > 0) {
			await sheetsApi.spreadsheets.values.append({
				spreadsheetId: spreadsheet_id,
				range: `${title}!A1`,
				valueInputOption: 'RAW',
				requestBody: {
					majorDimension: 'ROWS',
					values: [headers],
				},
			});
		}

		return {
			found: false,
			created: true,
			worksheet: newSheetProperties,
		};
	},
});
