import {
	createAction,
	Property,
} from '@activepieces/pieces-framework';
import { createGoogleClient, googleSheetsAuth } from '../common/common';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { google } from 'googleapis';
import { includeTeamDrivesProp } from '../common/props';
import { getAccessToken, GoogleSheetsAuthValue } from '../common/common';

export const createSpreadsheetAction = createAction({
	auth: googleSheetsAuth,
	name: 'create-spreadsheet',
	displayName: 'Create Spreadsheet',
	description: 'Creates a blank spreadsheet.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the new spreadsheet.',
			required: true,
		}),
		includeTeamDrives: includeTeamDrivesProp(),
		folder: Property.Dropdown({
			displayName: 'Parent Folder',
			description:
				'The folder to create the spreadsheet in. IMPORTANT: When using a service account, you must specify a shared folder to avoid storage quota issues.',
			required: false,
			refreshers: ['includeTeamDrives'],
			options: async ({ auth, includeTeamDrives }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please authenticate first',
					};
				}
	            const authValue = auth as GoogleSheetsAuthValue;
				let folders: { id: string; name: string }[] = [];
				let pageToken = null;
				do {
					const request: HttpRequest = {
						method: HttpMethod.GET,
						url: `https://www.googleapis.com/drive/v3/files`,
						queryParams: {
							q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
							includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
							supportsAllDrives: 'true',
						},
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: await getAccessToken(authValue),
						},
					};
					if (pageToken) {
						if (request.queryParams !== undefined) {
							request.queryParams['pageToken'] = pageToken;
						}
					}
					try {
						const response = await httpClient.sendRequest<{
							files: { id: string; name: string }[];
							nextPageToken: string;
						}>(request);
						folders = folders.concat(response.body.files);
						pageToken = response.body.nextPageToken;
					} catch (e) {
						throw new Error(`Failed to get folders\nError:${e}`);
					}
				} while (pageToken);

				return {
					disabled: false,
					options: folders.map((folder: { id: string; name: string }) => {
						return {
							label: folder.name,
							value: folder.id,
						};
					}),
				};
			},
		}),
	},
	async run(context) {
		const { title, folder } = context.propsValue;
		const response = await createSpreadsheet(context.auth, title, folder);
		return {
			id: response.id,
		};
	},
});
	
async function createSpreadsheet(
	auth: GoogleSheetsAuthValue,
	title: string,
	folderId?: string,
) {
	const client = await createGoogleClient(auth);
	const filesApi = google.drive({ version: 'v3', auth: client });
	const response = await filesApi.files.create({
		requestBody: {
			name: title,
			mimeType: 'application/vnd.google-apps.spreadsheet',
			parents: folderId ? [folderId] : undefined,
		},
		supportsAllDrives: true,
	});
	return response.data;
}