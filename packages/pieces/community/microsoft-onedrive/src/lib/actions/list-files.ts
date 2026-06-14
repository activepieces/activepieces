import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { oneDriveAuth } from '../auth';
import { oneDriveCommon } from '../common/common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

export const listFiles = createAction({
	auth: oneDriveAuth,
	name: 'list_files',
	description: 'List files in a OneDrive folder',
	audience: 'both',
	aiMetadata: { description: 'List the files contained in a Microsoft OneDrive folder, returning only file items (subfolders are excluded) and paging through all results. Provide a parent folder ID to scope the listing, or leave it empty to list from the drive root. Read-only and idempotent.', idempotent: true },
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

		const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
			baseUrl: getGraphBaseUrl(cloud),
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
