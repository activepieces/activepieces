import {
	createTrigger,
	TriggerStrategy,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
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
			resourceUri: '/videos',
			query: qs,
		});

		const items = response.data || [];

		const newItems = items.filter((video) => {
			if (!lastFetchEpochMS) return true;
			const createdAt = new Date(video.created_at || video.created).getTime();
			return createdAt > lastFetchEpochMS;
		});

		return newItems.map((item) => ({
			epochMilliSeconds: new Date(item.created_at || item.created).getTime(),
			data: item,
		}));
	},
};

export const newVideoTrigger = createTrigger({
	auth: placidAuth,
	name: 'new-video-trigger',
	displayName: 'New Video Generated',
	description: 'Triggers when a new video is created from a template.',
	type: TriggerStrategy.POLLING,
	props: {},
	sampleData: {
		id: 'vid_abc123',
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
