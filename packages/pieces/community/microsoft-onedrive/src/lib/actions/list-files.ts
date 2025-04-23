import { createAction } from '@activepieces/pieces-framework';
import { oneDriveAuth } from '../../';
import { oneDriveCommon } from '../common/common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

export const listFiles = createAction({
	auth: oneDriveAuth,
	name: 'list_files',
	description: 'List files in a OneDrive folder',
	displayName: 'List Files',
	props: {
		markdown:oneDriveCommon.parentFolderInfo,
		parentFolder: oneDriveCommon.parentFolder,
	},
	async run(context) {
		const endpoint = context.propsValue.parentFolder
			? `/me/drive/items/${context.propsValue.parentFolder}/children`
			: `/me/drive/items/root/children`;

		const files = [];

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});
		let response: PageCollection = await client.api(endpoint).get();

		while (response.value.length > 0) {
			for (const item of response.value as DriveItem[]) {
				if (item.file) {
					files.push(item);
				}
			}

			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return files;
	},
});
