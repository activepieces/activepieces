import { googleDocsAuth } from '../../index';
import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const folderIdProp = Property.Dropdown({
	displayName: 'Folder',
	refreshers: [],
	required: false,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect to your Google Drive account.',
				options: [],
			};
		}
		const authValue = auth as PiecePropValueSchema<typeof googleDocsAuth>;

		const authClient = new OAuth2Client();
		authClient.setCredentials(authValue);

		const drive = google.drive({ version: 'v3', auth: authClient });

		const options: DropdownOption<string>[] = [];

		let nextPageToken;

		do {
			const response: any = await drive.files.list({
				q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
				supportsAllDrives: true,
                orderBy:'createdTime desc',
				includeItemsFromAllDrives: true,
				pageToken: nextPageToken,
			});

			const fileList: drive_v3.Schema$FileList = response.data;

			if (fileList.files) {
				for (const file of fileList.files)
					options.push({
						label: file.name!,
						value: file.id!,
					});
			}
			nextPageToken = response.data.nextPageToken;
		} while (nextPageToken);

		return {
			disabled: false,
			options,
		};
	},
});
