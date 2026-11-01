import { googleDocsAuth, createGoogleClient } from '../auth';
import { DropdownOption, isNil, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive, drive_v3 } from '@googleapis/drive';
import { driveQuery } from './drive-query';

export const folderIdProp = Property.Dropdown({
	displayName: 'Folder',
	description: 'Leave empty to include all of Drive.',
	refreshers: [],
	refreshOnSearch: true,
	auth: googleDocsAuth,
	required: false,
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

		const trimmedSearchValue = searchValue?.trim() ?? '';
		const q = ["mimeType='application/vnd.google-apps.folder'", 'trashed = false'];

		if (trimmedSearchValue.length > 0) {
			q.push(`name contains '${driveQuery.escapeLiteral(trimmedSearchValue)}'`);
		}

		const response = await drive.files.list({
			q: q.join(' and '),
			pageSize: DROPDOWN_PAGE_SIZE,
			orderBy: 'createdTime desc',
			fields: 'nextPageToken, files(id, name)',
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
			corpora: 'allDrives',
		});

		const fileList: drive_v3.Schema$FileList = response.data;

		const options: DropdownOption<string>[] = (fileList.files ?? []).flatMap((file) =>
			isNil(file.id) || isNil(file.name) ? [] : [{ label: file.name, value: file.id }],
		);

		return {
			disabled: false,
			placeholder: isNil(fileList.nextPageToken)
				? undefined
				: `Showing the first ${options.length} folders. Type to narrow the list.`,
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

			const trimmedSearchValue = searchValue?.trim() ?? '';
			const q = ["mimeType='application/vnd.google-apps.document'", 'trashed = false'];

			if (trimmedSearchValue.length > 0) {
				q.push(`name contains '${driveQuery.escapeLiteral(trimmedSearchValue)}'`);
			}

			const response = await drive.files.list({
				q: q.join(' and '),
				pageSize: DROPDOWN_PAGE_SIZE,
				orderBy: 'createdTime desc',
				fields: 'nextPageToken, files(id, name)',
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
				corpora: 'allDrives',
			});

			const fileList: drive_v3.Schema$FileList = response.data;

			const options: DropdownOption<string>[] = (fileList.files ?? []).flatMap((file) =>
				isNil(file.id) || isNil(file.name) ? [] : [{ label: file.name, value: file.id }],
			);

			return {
				disabled: false,
				placeholder: isNil(fileList.nextPageToken)
					? undefined
					: `Showing the first ${options.length} documents. Type to narrow the list.`,
				options,
			};
		},
	});

const DROPDOWN_PAGE_SIZE = 1000;
