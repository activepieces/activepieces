import {
	createAction,
	DynamicPropsValue,
	InputPropertyMap,
	OAuth2PropertyValue,
	Property,
} from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { drive_v3, google, sheets_v4 } from 'googleapis';
import { createGoogleClient, getAccessToken, googleSheetsAuth, GoogleSheetsAuthValue } from '../common/common';
import { isNil } from '@activepieces/shared';

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
		includeTeamDrivesProp: Property.DynamicProperties({
			displayName: 'Include Team Drives',
			description: 'Determines if team drives should be included in the results.',
			required: false,
			refreshers: ['auth'],
			props: async ({auth})=>{
				const propsMap: InputPropertyMap = {};
				if (!auth) {
					return propsMap;
				}
				const authValue = auth as GoogleSheetsAuthValue;
				if('serviceAccount' in authValue) { return propsMap; }
				propsMap.includeTeamDrives = Property.Checkbox({
					displayName: 'Include Team Drives',
					description: 'Determines if shared drives should be included in the search for parent folder.',
					required: false,
					defaultValue: false,
				});
				return propsMap;
			}
		}),
		folderProp: Property.DynamicProperties({
			displayName: 'Parent Folder',
			description:
				'The folder to create the worksheet in.By default, the new worksheet is created in the root folder of drive.',
			required: false,
			refreshers: ['includeTeamDrivesProp','auth'],
			props: async ({ auth, includeTeamDrivesProp }) => {
				const propsMap: InputPropertyMap = {};
				if (!auth) {
					return propsMap;
				}
				const authValue = auth as GoogleSheetsAuthValue;
				const isServiceAccount = 'serviceAccount' in authValue;
				const includeTeamDrives = (includeTeamDrivesProp as DynamicPropsValue)['includeTeamDrives']  || isServiceAccount;
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
							files: { id: string; name: string, teamDriveId?: string }[];
							nextPageToken: string;
						}>(request);
						folders = folders.concat(response.body.files.filter((file) => !isNil(file.teamDriveId) || !isServiceAccount));
						pageToken = response.body.nextPageToken;
					} catch (e) {
						throw new Error(`Failed to get folders\nError:${e}`);
					}
				} while (pageToken);

				return {
					folderId: Property.StaticDropdown({
						displayName: isServiceAccount ? 'Shared Drive Folder' : 'Folder',
						options: {
							options:  folders.map((folder) => {
								return {
									label: folder.name,
									value: folder.id,
								};
							})
						},
						required: isServiceAccount,
					})
				};
			},
			
		}),
	},
	async run(context) {
		const { title, folderProp } = context.propsValue;
		const folderId =  folderProp?.['folderId'];
		const response = await createSpreadsheet(context.auth, title, folderId);
		return {
			id: response.id,
		};
	},
});

async function createSpreadsheet(
	auth: GoogleSheetsAuthValue,
	title: string,
	folderId: string | undefined,
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

