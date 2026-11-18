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
import { hubspotPolling, PollDeadline } from '../common/polling';
import { newBlogArticleTriggerOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	articleState: string;
};

type ListBlogPostsResponse = {
	results: Array<Record<string, unknown>>;
	paging?: {
		next?: {
			after: string;
		};
	};
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const states = propsValue.articleState === 'BOTH' ? ['PUBLISHED', 'DRAFT'] : [propsValue.articleState];
		const isTestMode = lastFetchEpochMS === 0;
		const token = getHubspotAccessToken(auth);
		const deadline = hubspotPolling.createPollDeadline();

		const posts = [];
		for (const state of states) {
			const found = await listPosts({ token, state, since: lastFetchEpochMS, isTestMode, deadline });
			posts.push(...found.map((post) => ({ epochMilliSeconds: postEpoch({ post, state }), data: post })));
		}

		const unique = new Map(posts.map((post) => [String(post.data['id']), post]));
		return [...unique.values()]
			.filter((post) => Number.isFinite(post.epochMilliSeconds))
			.sort((a, b) =>
				isTestMode ? b.epochMilliSeconds - a.epochMilliSeconds : a.epochMilliSeconds - b.epochMilliSeconds,
			);
	},
};

function postEpoch({ post, state }: { post: Record<string, unknown>; state: string }): number {
	return state === 'PUBLISHED'
		? hubspotPolling.toEpoch(post['publishDate'])
		: hubspotPolling.toEpoch(post['created'] ?? post['createdAt']);
}

async function listPosts({
	token,
	state,
	since,
	isTestMode,
	deadline,
}: {
	token: string;
	state: string;
	since: number;
	isTestMode: boolean;
	deadline: PollDeadline;
}): Promise<Record<string, unknown>[]> {
	const qs: QueryParams = { limit: '100', sort: '-createdAt', state };
	if (!isTestMode) {
		qs[state === 'PUBLISHED' ? 'publishDate__gt' : 'createdAt__gt'] = since.toString();
	}

	const posts = [];
	let after: string | undefined;
	do {
		const response = await httpClient.sendRequest<ListBlogPostsResponse>({
			method: HttpMethod.GET,
			url: 'https://api.hubapi.com/cms/v3/blogs/posts',
			queryParams: after ? { ...qs, after } : qs,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token },
		});
		posts.push(...response.body.results);
		after = response.body.paging?.next?.after;
		if (isTestMode) {
			break;
		}
		if (after && deadline.reached()) {
			throw new Error('HubSpot blog posts could not be read before the poll deadline; the next poll retries');
		}
	} while (after);
	return posts;
}

export const newBlogArticleTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-blog-article',
	classification: 'READ',
	displayName: 'New Blog Post',
	description: 'Triggers when a post is added to your HubSpot blog.',
	aiMetadata: {
		description:
			'Fires when a blog post is added to your HubSpot COS (CMS) blog. The configured article state (Published only, Draft only, or Both) determines which posts qualify; published posts are tracked by publish date and drafts by creation date. Each event represents one blog post with its full CMS metadata.',
	},
	outputSchema: newBlogArticleTriggerOutputSchema,
	type: TriggerStrategy.POLLING,
	props: {
		articleState: Property.StaticDropdown({
			displayName: 'Post Status',
			required: true,
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{
						label: 'Published Only',
						value: 'PUBLISHED',
						description: 'Live posts only',
						icon: 'send',
					},
					{
						label: 'Draft Only',
						value: 'DRAFT',
						description: 'Unpublished only',
						icon: 'file',
					},
					{
						label: 'Both',
						value: 'BOTH',
						description: 'Drafts and live',
						icon: 'inbox',
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
	sampleData: {},
});
