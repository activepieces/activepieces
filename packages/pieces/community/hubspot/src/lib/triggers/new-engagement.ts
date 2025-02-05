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

type EngagementResponse = {
	results: Array<Record<string, any>>;
	hasMore: boolean;
	offset: string;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const eventType = propsValue.eventType;
		const engagements = [];

		let hasMore = true;
		const qs: QueryParams = { limit: '100' };
		do {
			const response = await httpClient.sendRequest<EngagementResponse>({
				method: HttpMethod.GET,
				url: 'https://api.hubapi.com/engagements/v1/engagements/paged',
				queryParams: qs,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.access_token,
				},
			});
			hasMore = response.body.hasMore;
			qs.offset = response.body.offset;
			for (const engagement of response.body.results) {
				engagements.push(engagement);
			}
		} while (hasMore);

		const filteredEngagements = eventType
			? engagements.filter((engagement) => engagement.engagement.type === eventType)
			: engagements;

		return filteredEngagements.map((item) => ({
			epochMilliSeconds: item.engagement.createdAt as number,
			data: item,
		}));
	},
};

export const newEngagementTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-engagement',
	displayName: 'New Engagement',
	description: 'Triggers when a new engagement is created.',
	type: TriggerStrategy.POLLING,
	props: {
		eventType: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Note',
						value: 'NOTE',
					},
					{
						label: 'Task',
						value: 'TASK',
					},
					{
						label: 'Meeting',
						value: 'MEETING',
					},
					{
						label: 'Email',
						value: 'EMAIL',
					},
					{
						label: 'Call',
						value: 'CALL',
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
	sampleData: {
		engagement: {
			id: 29090716,
			portalId: 62515,
			active: true,
			createdAt: 1444223400781,
			lastUpdated: 1444223400781,
			createdBy: 215482,
			modifiedBy: 215482,
			ownerId: 70,
			type: 'NOTE',
			timestamp: 1444223400781,
		},
		associations: {
			contactIds: [247],
			companyIds: [],
			dealIds: [],
			ownerIds: [],
			workflowIds: [],
		},
		attachments: [],
		metadata: {
			body: 'This is a test note ',
		},
	},
});
