import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import {
	createTrigger,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { AppConnectionValueForAuthProperty, isNil } from '@activepieces/pieces-framework';
import { hubspotPolling } from '../common/polling';


const polling: Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const token = getHubspotAccessToken(auth);
		const isTestMode = lastFetchEpochMS === 0;
		const engagements = isTestMode
			? await fetchSampleEngagements({ token })
			: await fetchEngagementsModifiedSince({ token, since: lastFetchEpochMS });

		const matching = engagements.filter(
			(item) =>
				Number.isFinite(item.engagement.createdAt) &&
				item.engagement.createdAt > lastFetchEpochMS &&
				(!propsValue.eventType || item.engagement.type === propsValue.eventType),
		);
		const unique = [...new Map(matching.map((item) => [item.engagement.id, item])).values()];
		const oldestFirst = unique.sort(
			(a, b) => a.engagement.createdAt - b.engagement.createdAt || a.engagement.id - b.engagement.id,
		);
		const ordered = isTestMode ? oldestFirst.reverse() : oldestFirst;
		return ordered.map((item) => ({
			epochMilliSeconds: item.engagement.createdAt,
			data: item,
		}));
	},
};

async function getEngagements({ token, path, queryParams }: { token: string; path: string; queryParams: QueryParams }) {
	const response = await httpClient.sendRequest<EngagementResponse>({
		method: HttpMethod.GET,
		url: `https://api.hubapi.com/engagements/v1/engagements/${path}`,
		queryParams,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token,
		},
	});
	return response.body;
}

async function fetchSampleEngagements({ token }: { token: string }): Promise<Engagement[]> {
	const recent = await getEngagements({ token, path: 'recent/modified', queryParams: { count: String(RECENT_PAGE_SIZE) } });
	if (recent.results.length > 0) {
		return recent.results;
	}
	const firstPage = await getEngagements({ token, path: 'paged', queryParams: { limit: String(RECENT_PAGE_SIZE) } });
	return firstPage.results;
}

async function fetchEngagementsModifiedSince({ token, since }: { token: string; since: number }): Promise<Engagement[]> {
	const deadline = hubspotPolling.createPollDeadline();
	let engagements: Engagement[] = [];
	let offset: string | undefined;
	for (;;) {
		const queryParams: QueryParams = { count: String(RECENT_PAGE_SIZE), since: since.toString() };
		if (offset) {
			queryParams.offset = offset;
		}
		const page = await getEngagements({ token, path: 'recent/modified', queryParams });
		engagements = [...engagements, ...page.results];
		offset = isNil(page.offset) ? undefined : String(page.offset);
		if (!page.hasMore || isNil(offset) || page.results.length === 0) {
			return engagements;
		}
		if (engagements.length >= RECENT_MAX_RESULTS || deadline.reached()) {
			console.warn(
				`[hubspot] recent engagements read stopped after ${engagements.length} records (10,000 result cap or poll deadline)`,
			);
			return engagements;
		}
	}
}

export const newEngagementTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-engagement',
	classification: 'READ',
	displayName: 'New Engagement',
	description: 'Triggers when a new engagement is created.',
	aiMetadata: {
		description:
			'Fires when a new engagement (interaction) is created in HubSpot, optionally filtered to a single type: Note, Task, Meeting, Email, or Call. Polls the recently created or modified engagements (HubSpot keeps the last 30 days there) and emits each engagement with its metadata and associations to contacts, companies, and deals. Represents a logged activity or touchpoint on a CRM record.',
	},
	type: TriggerStrategy.POLLING,
	props: {
		eventType: Property.StaticDropdown({
			displayName: 'Engagement Type',
			description: 'Leave empty to trigger on every engagement type.',
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
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return hubspotPolling.sampleOldestToNewest({ items: await pollingHelper.test(polling, context) });
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

const RECENT_PAGE_SIZE = 100;
const RECENT_MAX_RESULTS = 10_000;

type Props = {
	eventType?: string;
};

type Engagement = {
	engagement: { id: number; createdAt: number; type: string } & Record<string, unknown>;
} & Record<string, unknown>;

type EngagementResponse = {
	results: Engagement[];
	hasMore: boolean;
	offset?: string | number;
};
