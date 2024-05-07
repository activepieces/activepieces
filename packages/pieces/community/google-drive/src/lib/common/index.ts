import {
	httpClient,
	HttpMethod,
	AuthenticationType,
	HttpRequest,
} from '@activepieces/pieces-common';
import {
	Property,
	OAuth2PropertyValue,
	PiecePropValueSchema,
	DropdownOption,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { googleDriveAuth } from '@activepieces/piece-google-drive';

export const common = {
	properties: {
		driveId: Property.Dropdown({
			displayName: 'Drive',
			refreshers: [],
			required: true,
			defaultValue: 'My Drive',
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect account first.',
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof googleDriveAuth>;

				const authClient = new OAuth2Client();
				authClient.setCredentials(authValue);

				const drive = google.drive({ version: 'v3', auth: authClient });
				const options: DropdownOption<string>[] = [{ label: 'My Drive', value: 'My Drive' }];

				let pageToken;
				do {
					const { data } = await drive.drives.list();
					pageToken = data.nextPageToken;

					if (data.drives) {
						for (const drive of data.drives) {
							options.push({ label: drive.name!, value: drive.id! });
						}
					}
				} while (pageToken);

				return {
					disabled: false,
					options,
				};
			},
		}),
		parentFolder: Property.Dropdown({
			displayName: 'Parent Folder',
			required: false,
			refreshers: ['driveId'],
			options: async ({ auth, driveId }) => {
				if (!auth || !driveId) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please authenticate first',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof googleDriveAuth>;
				const driveValue = driveId as string;

				const authClient = new OAuth2Client();
				authClient.setCredentials(authValue);

				const drive = google.drive({ version: 'v3', auth: authClient });

				let options: DropdownOption<string>[] = [];
				let pageToken;

				do {
					const { data } = await drive.files.list({
						q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
						fields: 'nextPageToken,files(id,name)',
						includeItemsFromAllDrives: true,
						supportsAllDrives: true,
						driveId: driveValue === 'My Drive' ? undefined : driveValue,
					});

					if (data.files) {
						for (const folder of data.files) {
							options.push({ label: folder.name!, value: folder.id! });
						}
					}

					pageToken = data.nextPageToken;
				} while (pageToken);

				return {
					disabled: false,
					options,
				};
			},
		}),
		include_team_drives: Property.Checkbox({
			displayName: 'Include Team Drives',
			description: 'Determines if folders from Team Drives should be included in the results.',
			defaultValue: false,
			required: false,
		}),
	},

	async getFiles(
		auth: OAuth2PropertyValue,
		search?: {
			parent?: string;
			createdTime?: string | number | Date;
			createdTimeOp?: string;
			includeTeamDrive?: boolean;
		},
		order?: string,
	) {
		const authClient = new OAuth2Client();
		authClient.setCredentials(auth);

		const drive = google.drive({ version: 'v3', auth: authClient });

		const q: string[] = [];
		if (search?.parent) q.push(`'${search.parent}' in parents`);
		if (search?.createdTime)
			q.push(`createdTime ${search.createdTimeOp ?? '>'} '${dayjs(search.createdTime).format()}'`);
		q.push(`trashed = false`);
		const response = await drive.files.list({
			q: q.concat("mimeType!='application/vnd.google-apps.folder'").join(' and '),
			fields: 'files(id, name, mimeType, webViewLink, kind)',
			orderBy: order ?? 'createdTime asc',
			supportsAllDrives: true,
			includeItemsFromAllDrives: search?.includeTeamDrive,
		});

		return response.data.files;
	},

	async getFolders(
		auth: OAuth2PropertyValue,
		search?: {
			parent?: string;
			createdTime?: string | number | Date;
			createdTimeOp?: string;
		},
		order?: string,
	) {
		const q: string[] = [`mimeType='application/vnd.google-apps.folder'`];
		if (search?.parent) q.push(`'${search.parent}' in parents`);
		if (search?.createdTime)
			q.push(`createdTime ${search.createdTimeOp ?? '>'} '${dayjs(search.createdTime).format()}'`);
		q.push(`trashed = false`);
		const response = await httpClient.sendRequest<{
			files: { id: string; name: string }[];
		}>({
			method: HttpMethod.GET,
			url: `https://www.googleapis.com/drive/v3/files`,
			queryParams: {
				q: q.join(' and '),
				orderBy: order ?? 'createdTime asc',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.access_token,
			},
		});

		return response.body.files;
	},
};
