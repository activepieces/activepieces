import {
	createTrigger,
	TriggerStrategy,
	Property,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof placidAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const qs: QueryParams = {
			limit: '50',
		};

		const response = await placidApiCall<{ data: any[] }>({
			apiKey: auth,
			method: HttpMethod.GET,
			resourceUri: '/images',
			query: qs,
		});

		const items = response.data || [];

		// Filter by time if needed
		const newItems = items.filter((img) => {
			if (!lastFetchEpochMS) return true;
			const createdAt = new Date(img.created_at || img.created).getTime();
			return createdAt > lastFetchEpochMS;
		});

		return newItems.map((item) => ({
			epochMilliSeconds: new Date(item.created_at || item.created).getTime(),
			data: item,
		}));
	},
};

export const newImageTrigger = createTrigger({
	auth: placidAuth,
	name: 'new-image-trigger',
	displayName: 'New Image Generated',
	description: 'Triggers when a new image is generated from a template.',
	type: TriggerStrategy.POLLING,
	props: {},
	sampleData: {
		id: 'img_abc123',
		status: 'done',
		created_at: '2025-07-13T12:00:00Z',
		url: 'https://storage.placid.app/...',
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
