import { hubspotAuth } from '../../';
import {
	createAction,
	DropdownOption,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const uploadFileAction = createAction({
	auth: hubspotAuth,
	name: 'upload-file',
	displayName: 'Upload File',
	description: 'Uploads a file to HubSpot File Manager.',
	props: {
		folderId: Property.Dropdown({
			displayName: 'Folder',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const client = new Client({ accessToken: authValue.access_token });

				const limit = 100;
				const options: DropdownOption<string>[] = [];
				let after: string | undefined;

				do {
					const response = await client.files.foldersApi.doSearch(
						undefined,
						after,
						undefined,
						limit,
					);

					for (const folder of response.results) {
						options.push({
							value: folder.id,
							label: folder.name ?? folder.id,
						});
					}
					after = response.paging?.next?.after;
				} while (after);

				return {
					disabled: false,
					options,
				};
			},
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			required: true,
		}),
		accessLevel: Property.StaticDropdown({
			displayName: 'Access Level',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						value: 'PUBLIC_INDEXABLE',
						label: 'PUBLIC_INDEXABLE',
					},
					{
						value: 'PUBLIC_NOT_INDEXABLE',
						label: 'PUBLIC_NOT_INDEXABLE',
					},
					{ label: 'PRIVATE', value: 'PRIVATE' },
				],
			},
		}),
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
	},
	async run(context) {
		const { accessLevel, fileName, folderId, file } = context.propsValue;
		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.files.filesApi.upload(
			{
				name: fileName,
				data: file.data,
			},
			folderId,
			undefined,
			fileName,
			undefined,
			JSON.stringify({
				access: accessLevel,
			}),
		);

        return response;
	},
});
