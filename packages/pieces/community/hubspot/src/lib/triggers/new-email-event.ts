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
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';

type Props = {
	eventType?: string;
};

type EmailEventResponse = {
	events: Array<Record<string, any>>;
	hasMore: boolean;
	offset: string;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const eventType = propsValue.eventType;
		const isTestMode = lastFetchEpochMS === 0;

		let hasMore = true;
		const qs: QueryParams = { limit: '100' };
		if (eventType) {
			qs.eventType = eventType;
		}
		if (lastFetchEpochMS) {
			qs.startTimestamp = lastFetchEpochMS.toString();
		}
		const emailEvents = [];

		do {
			const response = await httpClient.sendRequest<EmailEventResponse>({
				method: HttpMethod.GET,
				url: 'https://api.hubapi.com/email/public/v1/events',
				queryParams: qs,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.access_token,
				},
			});
			hasMore = response.body.hasMore;
			qs.offset = response.body.offset;
			for (const event of response.body.events) {
				emailEvents.push(event);
			}
			if (isTestMode) break;
		} while (hasMore);

		return emailEvents.map((item) => ({
			epochMilliSeconds: item['created'] as number,
			data: item,
		}));
	},
};

export const newEmailEventTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-email-event',
	displayName: 'New Email Event',
	description: 'Triggers when all,or specific new email event is available.',
	type: TriggerStrategy.POLLING,
	props: {
		eventType: Property.StaticDropdown({
			displayName: 'Event Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Sent',
						value: 'SENT',
					},
					{
						label: 'Dropped',
						value: 'DROPPED',
					},
					{
						label: 'Processed',
						value: 'PROCESSED',
					},
					{
						label: 'Delivered',
						value: 'DELIVERED',
					},
					{
						label: 'Deferred',
						value: 'DEFERRED',
					},
					{
						label: 'Bounce',
						value: 'BOUNCE',
					},
					{
						label: 'Open',
						value: 'OPEN',
					},
					{
						label: 'Click',
						value: 'CLICK',
					},
					{
						label: 'Status Change',
						value: 'STATUSCHANGE',
					},
					{
						label: 'Spam Report',
						value: 'SPAMREPORT',
					},
				],
			},
		}),
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
	sampleData: {},
});
