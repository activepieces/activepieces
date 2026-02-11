import { googleDocsAuth, createGoogleClient, GoogleDocsAuthValue } from '.';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { drive_v3 } from 'googleapis';

export const folderIdProp = Property.Dropdown({
	displayName: 'Folder',
	refreshers: [],
	auth: googleDocsAuth,
	required: false,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect to your Google Drive account.',
				options: [],
			};
		}
		const authValue = auth as GoogleDocsAuthValue;

		const authClient = await createGoogleClient(authValue);

		const { google } = await import('googleapis');
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
