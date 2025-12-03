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
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

type Props = {
	siteId: string;
	driveId: string;
	folderId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftSharePointAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { siteId, driveId, folderId } = propsValue;
		const isTestMode = lastFetchEpochMS === 0;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const files = [];

		const endpoint =
			folderId !== 'root'
				? `/sites/${siteId}/drive/items/${folderId}/children`
				: `/sites/${siteId}/drives/${driveId}/items/root/children`;

		let response: PageCollection = await client
			.api(endpoint)
			.orderby('lastModifiedDateTime desc')
			.get();

		let stop = false;

		while (!stop && response.value.length > 0) {
			for (const item of response.value as DriveItem[]) {
				if (!item.file) continue;

				const modifiedMs = dayjs(item.lastModifiedDateTime).valueOf();

				if (isTestMode) {
					files.push(item);
					if (files.length >= 10) {
						stop = true;
					}
					continue;
				}

				if (modifiedMs < lastFetchEpochMS) {
					stop = true;
					break;
				}

				files.push(item);
			}

			if (stop || !response['@odata.nextLink']) break;

			response = await client.api(response['@odata.nextLink']).get();
		}

		files.sort((a, b) => {
			const aDate = dayjs(a.lastModifiedDateTime);
			const bDate = dayjs(b.lastModifiedDateTime);
			return bDate.diff(aDate);
		});

		return files.map((file) => ({
			epochMilliSeconds: dayjs(file.lastModifiedDateTime).valueOf(),
			data: file,
		}));
	},
};

export const newOrUpdatedFileTrigger = createTrigger({
	auth: microsoftSharePointAuth,
	name: 'new_or_updated_file',
	displayName: 'New or Updated File',
	description: 'Triggers when a file is created or updated in a given folder.',
	props: {
		siteId: microsoftSharePointCommon.siteId,
		driveId: microsoftSharePointCommon.driveId,
		folderId: Property.Dropdown({
			auth: microsoftSharePointAuth,
			displayName: 'Folder to Monitor',	
			description:
				'The folder to watch for new or updated files. Select "Root Folder" for the top-level folder of the drive.',
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
		id: '01DRYVE_ID_GOES_HERE',
		name: 'Updated-Financials.xlsx',
		webUrl: 'https://contoso.sharepoint.com/Shared%20Documents/Updated-Financials.xlsx',
		size: 65432,
		createdDateTime: '2025-09-26T10:00:00Z',
		lastModifiedDateTime: '2025-09-26T14:34:00Z',
		file: {
			mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
