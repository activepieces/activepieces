import {
	createTrigger,
	TriggerStrategy,
	Property,
	PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { crispAuth } from '../common/auth';
import { websiteIdProp } from '../common/props';
import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { crispApiCall } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof crispAuth>, { websiteId: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS, propsValue }) {
		const websiteId = propsValue.websiteId;

		let page = 1;
		let hasMoreItems = false;
		const conversations = [];
		do {
			const qs: QueryParams = {
				per_page: '50',
			};
			if (lastFetchEpochMS) {
				qs['filter_date_start'] = dayjs(lastFetchEpochMS).toString();
			}

			const response = await crispApiCall<{ data: { created_at: number }[] }>({
				auth,
				method: HttpMethod.GET,
				resourceUri: `/website/${websiteId}/conversations/${page}`,
				query: qs,
			});

			const items = response.data || [];
			conversations.push(...items);

			page++;
			hasMoreItems = items.length > 0;

			if (lastFetchEpochMS === 0) break;
		} while (hasMoreItems);

		return conversations.map((conv) => ({
			epochMilliSeconds: conv.created_at,
			data: conv,
		}));
	},
};

export const newConversationTrigger = createTrigger({
	auth: crispAuth,
	name: 'new_conversation',
	displayName: 'New Conversation Created',
	description: 'Triggers when a new conversation is started.',
	props: {
		websiteId: websiteIdProp,
	},
	type: TriggerStrategy.POLLING,
	sampleData: {},
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
