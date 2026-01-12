import {
	AppConnectionValueForAuthProperty,
	createAction,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { google } from 'googleapis';
import { includeTeamDrivesProp } from '../common/props';
import { createGoogleClient, getAccessToken, googleSheetsAuth } from '../common/common';
import { AppConnectionType, isNil } from '@activepieces/shared';

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
			auth: googleSheetsAuth,
			displayName: 'Parent Folder',
			description:
				'The folder to create the worksheet in.By default, the new worksheet is created in the root folder of drive.',
			required: false,
			refreshers: ['auth', 'includeTeamDrives'],
			options: async ({ auth, includeTeamDrives }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please authenticate first',
					};
				}
				const authProp = auth;
				let folders: { id: string; name: string }[] = [];
				const isServiceAccountWithoutImpersonation = authProp.type === AppConnectionType.CUSTOM_AUTH && authProp.props.userEmail?.length === 0;
				let pageToken = null;
				do {
					const request: HttpRequest = {
						method: HttpMethod.GET,
						url: `https://www.googleapis.com/drive/v3/files`,
						queryParams: {
							q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
							includeItemsFromAllDrives: includeTeamDrives || isServiceAccountWithoutImpersonation ? 'true' : 'false',
							supportsAllDrives: 'true',
						},
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: await getAccessToken(authProp),
						},
					};
					if (pageToken) {
						if (request.queryParams !== undefined) {
							request.queryParams['pageToken'] = pageToken;
						}
					}
					try {
						const response = await httpClient.sendRequest<{
							files: { id: string; name: string,teamDriveId?: string }[];
							nextPageToken: string;
						}>(request);
						folders = folders.concat(response.body.files.filter(file => !isNil(file.teamDriveId) || !isServiceAccountWithoutImpersonation));
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
		const newSpreadsheetId = response.id;

	

		return {
			id: newSpreadsheetId,
		};
	},
});

async function createSpreadsheet(
	auth: AppConnectionValueForAuthProperty<typeof googleSheetsAuth>,
	title: string,
	folderId?: string,
) {
	const googleClient = await createGoogleClient(auth);
  const driveApi = google.drive({ version: 'v3', auth: googleClient });
  const response = await driveApi.files.create({
    requestBody: {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: folderId ? [folderId] : undefined,
    },
    supportsAllDrives: true,
  });
  return response.data;
}

