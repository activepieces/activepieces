import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { oneDriveAuth } from '../..';
import { oneDriveCommon } from '../common/common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';

type Props = {
	parentFolder?: string;
};

const polling: Polling<PiecePropValueSchema<typeof oneDriveAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const files = [];

		const endpoint = propsValue.parentFolder
			? `/me/drive/items/${propsValue.parentFolder}/children`
			: `/me/drive/items/root/children`;
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

		files.sort((a, b) => {
			const aDate = dayjs(a.createdDateTime);
			const bDate = dayjs(b.createdDateTime);
			return bDate.diff(aDate);
		});

		return files.map((file) => ({
			epochMilliSeconds: dayjs(file.createdDateTime).valueOf(),
			data: file,
		}));
	},
};

export const newFile = createTrigger({
	auth: oneDriveAuth,
	name: 'new_file',
	displayName: 'New File',
	description: 'Trigger when a new file is uploaded.',
	props: {
		markdown:oneDriveCommon.parentFolderInfo,
		parentFolder: oneDriveCommon.parentFolder,
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		id: '123456',
		name: 'example.jpg',
		createdDateTime: '2023-10-20T10:16:35.5Z',
		cTag: '07NkI9QUVCNEY1QzU9ITEySi4yNTD',
		eTag: '331E4899BE5BFA2!sccbdc3441b454cc0a13be0f6be58ca3d',
		lastModifiedDateTime: '2023-10-20T10:16:35.5Z',
		size: 53431,
		createdBy: {
			application: {
				id: '00000000-0000-0000-0000-0000481710a4',
				displayName: '4c5b-b112-36a304b66dad',
			},
			user: {
				email: 'john@outlook.com',
				id: '0331E4899BE5BFA2',
				displayName: 'John Doe',
			},
		},
		lastModifiedBy: {
			application: {
				id: '00000000-0000-0000-0000-0000481710a4',
				displayName: '36a304b66dad',
			},
			user: {
				email: 'john@outlook.com',
				id: '0331E4899BE5BFA2',
				displayName: 'John Doe',
			},
		},
		parentReference: {
			driveType: 'personal',
			driveId: 'E4899BE5BFA2',
			id: '48dd8265f06fd5e8024d',
			name: 'child',
			path: '/drive/root:/parent/child',
			siteId: '043b2233-0eed-436a',
		},
		file: {
			mimeType: 'image/jpeg',
		},
		fileSystemInfo: {
			createdDateTime: '2025-01-22T09:30:10Z',
			lastModifiedDateTime: '2025-01-22T09:30:12Z',
		},
	},
});
