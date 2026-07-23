import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSheetsAuth } from '../common/common';

export const sheetsCreateSpreadsheet = createAction({
	auth: googleSheetsAuth,
	name: 'sheets_create_spreadsheet',
	displayName: 'Create Spreadsheet',
	description: 'Create a new, empty Google Sheets spreadsheet.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new, empty Google Sheets spreadsheet with the given title, optionally inside a Drive folder (resolve the folder id via the Drive piece\'s search). Use when an agent needs a fresh spreadsheet to populate. Not idempotent — each call creates a separate spreadsheet even with the same title.',
		idempotent: false,
	},
	props: {
		spreadsheet_title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the new spreadsheet.',
			required: true,
		}),
		parent_folder_id: Property.ShortText({
			displayName: 'Parent Folder ID',
			description:
				'Optional Drive folder id to create the spreadsheet in. By default, the new spreadsheet is created in the root folder of Drive.',
			required: false,
		}),
	},
	async run(context) {
		const { spreadsheet_title, parent_folder_id } = context.propsValue;

		const googleClient = await createGoogleClient(context.auth);
		const driveApi = googleDrive({ version: 'v3', auth: googleClient });
		const response = await driveApi.files.create({
			requestBody: {
				name: spreadsheet_title,
				mimeType: 'application/vnd.google-apps.spreadsheet',
				parents: parent_folder_id ? [parent_folder_id] : undefined,
			},
			supportsAllDrives: true,
		});

		return {
			id: response.data.id,
		};
	},
});
