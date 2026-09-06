import { googleDocsAuth, createGoogleClient, GoogleDocsAuthValue } from '../auth';
import { DropdownOption, isNil, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive, drive_v3 } from '@googleapis/drive';

export const folderIdProp = Property.Dropdown({
	displayName: 'Folder',
	description: 'Leave empty to include all of Drive.',
	refreshers: [],
	auth: googleDocsAuth,
	required: false,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your account first',
				options: [],
			};
		}
		const authValue = auth as GoogleDocsAuthValue;

		const authClient = await createGoogleClient(authValue);

		const drive = googleDrive({ version: 'v3', auth: authClient });

		const options: DropdownOption<string>[] = [];

		let nextPageToken;

		do {
			const response: any = await drive.files.list({
				q: "mimeType='application/vnd.google-apps.folder' and trashed = false",
				supportsAllDrives: true,
                orderBy:'createdTime desc',
				includeItemsFromAllDrives: true,
				corpora: 'allDrives',
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

export const documentIdProp = ({ description }: { description?: string } = {}) =>
	Property.Dropdown({
		displayName: 'Document',
		description,
		auth: googleDocsAuth,
		required: true,
		refreshers: [],
		refreshOnSearch: true,
		options: async ({ auth }, { searchValue }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Connect your account first',
					options: [],
				};
			}

			const authClient = await createGoogleClient(auth);

			const drive = googleDrive({ version: 'v3', auth: authClient });

			const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];

			if (searchValue) {
				q.push(`name contains '${searchValue}'`);
			}

			const options: DropdownOption<string>[] = [];
			let nextPageToken: string | undefined = undefined;

			do {
				const response = await drive.files.list({
					q: q.join(' and '),
					pageToken: nextPageToken,
					orderBy: 'createdTime desc',
					fields: 'nextPageToken, files(id, name)',
					supportsAllDrives: true,
					includeItemsFromAllDrives: true,
					corpora: 'allDrives',
				});

				const fileList: drive_v3.Schema$FileList = response.data;

				for (const file of fileList.files ?? []) {
					if (isNil(file.id) || isNil(file.name)) {
						continue;
					}
					options.push({
						label: file.name,
						value: file.id,
					});
				}

				nextPageToken = fileList.nextPageToken ?? undefined;
			} while (nextPageToken);

			return {
				disabled: false,
				options,
			};
		},
	});
