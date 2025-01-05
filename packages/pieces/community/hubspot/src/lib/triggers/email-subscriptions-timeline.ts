import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import { hubspotAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';

type SubscriptionTimeLineResponse = {
	hasMore: boolean;
	offset: string;
	timeline: Array<Record<string, any>>;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Record<string, any>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const qs: QueryParams = { limit: '100' };
		if (lastFetchEpochMS) {
			qs.startTimestamp = lastFetchEpochMS.toString();
		}
		const items = [];

		let hasMore = true;
		do {
			const response = await httpClient.sendRequest<SubscriptionTimeLineResponse>({
				method: HttpMethod.GET,
				url: 'https://api.hubapi.com/email/public/v1/subscriptions/timeline',
				queryParams: qs,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.access_token,
				},
			});
			hasMore = response.body.hasMore;
			qs.offset = response.body.offset;
			for (const item of response.body.timeline) {
				items.push(item);
			}
		} while (hasMore);

		return items.map((item) => ({
			epochMilliSeconds: item.timestamp as number,
			data: item,
		}));
	},
};

export const newEmailSubscriptionsTimelineTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-email-subscriptions-timeline',
	displayName: 'New Email Subscriptions Timeline',
	description: 'Triggers when a new email timeline subscription added for the portal.',
	type: TriggerStrategy.POLLING,
	props: {},
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
		timestamp: 1401975207000,
		portalId: 62515,
		recipient: '6d4b537e-c5ac-11e3-a673-00262df65d03@some.email.com',
		changes: [
			{
				change: 'BOUNCED',
				source: 'SOURCE_NON_DELIVERY_REPORT',
				portalId: 62515,
				changeType: 'PORTAL_BOUNCE',
				causedByEvent: {
					id: '6d72d39c-87da-3ced-bfdf-5f0213363827',
					created: 1401975207000,
				},
			},
		],
	},
});
