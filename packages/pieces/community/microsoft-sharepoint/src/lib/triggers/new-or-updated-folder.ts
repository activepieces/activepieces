import { microsoftSharePointAuth } from '../../';
import {
	createTrigger,
	TriggerStrategy,
	Property,
	DropdownOption,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

type Props = {
	siteId: string;
	driveId: string;
	parentFolderId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftSharePointAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { siteId, driveId, parentFolderId } = propsValue;
		const isTestMode = lastFetchEpochMS === 0;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const folders = [];

		const endpoint =
			parentFolderId !== 'root'
				? `/sites/${siteId}/drive/items/${parentFolderId}/children`
				: `/sites/${siteId}/drives/${driveId}/items/root/children`;

		let response: PageCollection = await client
			.api(endpoint)
			.orderby('lastModifiedDateTime desc')
			.get();

		let stop = false;

		while (!stop && response.value.length > 0) {
			for (const item of response.value as DriveItem[]) {
				if (!item.folder) continue;

				const modifiedMs = dayjs(item.lastModifiedDateTime).valueOf();

				if (isTestMode) {
					folders.push(item);
					if (folders.length >= 10) {
						stop = true;
					}
					continue;
				}

				if (modifiedMs < lastFetchEpochMS) {
					stop = true;
					break;
				}

				folders.push(item);
			}

			if (stop || !response['@odata.nextLink']) break;

			response = await client.api(response['@odata.nextLink']).get();
		}

		folders.sort((a, b) => {
			const aDate = dayjs(a.lastModifiedDateTime);
			const bDate = dayjs(b.lastModifiedDateTime);
			return bDate.diff(aDate);
		});

		return folders.map((folder) => ({
			epochMilliSeconds: dayjs(folder.lastModifiedDateTime).valueOf(),
			data: folder,
		}));
	},
};

export const newOrUpdatedFolderTrigger = createTrigger({
	auth: microsoftSharePointAuth,
	name: 'new_or_updated_folder',
	displayName: 'New or Updated Folder',
	description: 'Triggers when a folder is created or updated (e.g., name change).',
	props: {
		siteId: microsoftSharePointCommon.siteId,
		driveId: microsoftSharePointCommon.driveId,
		parentFolderId: Property.Dropdown({
			auth: microsoftSharePointAuth,
			displayName: 'Parent Folder to Monitor',
			description:
				'The folder to watch for new or updated subfolders. Select "Root Folder" to monitor the top-level of the drive.',
			required: true,
			refreshers: ['siteId', 'driveId'],
			options: async ({ auth, siteId, driveId }) => {
				if (!auth || !siteId || !driveId) {
					return {
						disabled: true,
						placeholder: 'Select a site and drive first.',
						options: [],
					};
				}
				const authValue = auth
				const client = Client.initWithMiddleware({
					authProvider: {
						getAccessToken: () => Promise.resolve(authValue.access_token),
					},
				});
				const options: DropdownOption<string>[] = [{ label: 'Root Folder', value: 'root' }];
				let response: PageCollection = await client
					.api(
						`/sites/${siteId}/drives/${driveId}/items/root/children?$filter=folder ne null&$select=id,name`,
					)
					.get();
				while (response.value.length > 0) {
					for (const item of response.value as DriveItem[]) {
						options.push({ label: item.name!, value: item.id! });
					}
					if (response['@odata.nextLink']) {
						response = await client.api(response['@odata.nextLink']).get();
					} else {
						break;
					}
				}
				return { disabled: false, options };
			},
		}),
	},
	type: TriggerStrategy.POLLING,

	sampleData: {
		id: '01DRYVE_FOLDER_ID_GOES_HERE',
		name: 'Project Alpha',
		webUrl: 'https://contoso.sharepoint.com/Shared%20Documents/Project%20Alpha',
		size: 0,
		createdDateTime: '2025-09-26T14:50:00Z',
		lastModifiedDateTime: '2025-09-26T14:50:00Z',
		folder: {
			childCount: 0,
		},
		parentReference: { id: 'PARENT_FOLDER_ID_HERE' },
	},
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
});
