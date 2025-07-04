import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { amazonS3Auth } from '../..';
import { createS3 } from '../common';
import dayjs from 'dayjs';
import { ListObjectsV2CommandInput } from '@aws-sdk/client-s3';
import { MarkdownVariant } from '@activepieces/shared';

const polling: Polling<PiecePropValueSchema<typeof amazonS3Auth>, { folderPath?: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const isTest = lastFetchEpochMS === 0;

		const s3 = createS3(auth);

		const bucketFiles = [];

		const MAX_TOTAL_FILES = 10000;
		let totalFetched = 0;

		let hasMore = true;
		let nextToken: string | undefined;

		do {
			const params: ListObjectsV2CommandInput = {
				Bucket: auth.bucket,
				MaxKeys: isTest ? 10 : 1000,
				ContinuationToken: nextToken,
			};

			if (propsValue.folderPath)
				params.Prefix = `${
					propsValue.folderPath.endsWith('/')
						? propsValue.folderPath.slice(0, -1)
						: propsValue.folderPath
				}`;

			const response = await s3.listObjectsV2(params);

			const items = response.Contents ?? [];

			// Check if adding these items would exceed the 10,000 limit
			if (totalFetched + items.length > MAX_TOTAL_FILES) {
				const remaining = MAX_TOTAL_FILES - totalFetched;
				bucketFiles.push(...items.slice(0, remaining));
				break;
			}

			bucketFiles.push(...items);
			totalFetched += items.length;

			if (isTest) break;

			hasMore = !!response.IsTruncated;
			nextToken = response.NextContinuationToken ?? undefined;
		} while (hasMore);

		return bucketFiles.map((file) => ({
			epochMilliSeconds: dayjs(file.LastModified).valueOf(),
			data: file,
		}));
	},
};

export const newFile = createTrigger({
	auth: amazonS3Auth,
	name: 'new_file',
	displayName: 'New or Updated File',
	description:
		'Triggers when you add or update a file in your bucket. The bucket/folder you choose must not contain more than 10,000 files.',
	props: {
		markdown:Property.MarkDown({
			variant:MarkdownVariant.INFO,
			value:'Triggers when you add or update a file in your bucket. The bucket/folder you choose must not contain more than 10,000 files.'
		}),
		folderPath: Property.ShortText({
			displayName: 'Folder Path',
			required: false,
		}),
	},
	type: TriggerStrategy.POLLING,
	onEnable: async (context) => {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	onDisable: async (context) => {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	run: async (context) => {
		return await pollingHelper.poll(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},
	test: async (context) => {
		return await pollingHelper.test(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},

	sampleData: {
		Key: 'myfolder/100-3.png',
		LastModified: '2023-08-04T13:51:26.000Z',
		ETag: '"e9f16cce12352322272525f5af65a2e"',
		Size: 40239,
		StorageClass: 'STANDARD',
	},
});
