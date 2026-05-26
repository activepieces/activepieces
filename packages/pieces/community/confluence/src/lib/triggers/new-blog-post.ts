import {
	createTrigger,
	TriggerStrategy,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { confluenceAuth, confluenceAuthValue } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { spaceIdProp } from '../common/props';

interface ConfluenceBlogPost {
	id: string;
	status: string;
	title: string;
	spaceId: string;
	createdAt: string;
	version: { number: number; createdAt: string };
}

const props = {
	spaceId: spaceIdProp,
};
const polling: Polling<confluenceAuthValue, { spaceId?: string }>  = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue }) {
		const response = await confluenceApiCall<PaginatedResponse<ConfluenceBlogPost>>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
			version: 'v2',
			method: HttpMethod.GET,
			resourceUri: `/spaces/${propsValue.spaceId}/blogposts`,
			query: {
				limit: '100',
				sort: '-created-date',
			},
		});

		if (isNil(response.results)) return [];

		return response.results.map((post) => ({
			epochMilliSeconds: new Date(post.createdAt).getTime(),
			data: post,
		}));
	},
};

export const newBlogPostTrigger = createTrigger({
	name: 'new-blog-post',
	displayName: 'New Blog Post',
	description: 'Triggers when a new blog post is published in the selected space.',
	auth: confluenceAuth,
	type: TriggerStrategy.POLLING,
	props,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	sampleData: {
		id: 'bp-1234',
		status: 'current',
		title: 'Sample Blog Post',
		spaceId: 'SAMPLE123',
		authorId: '12345678abcd',
		createdAt: '2024-01-03T12:00:00.000Z',
		version: {
			number: 1,
			createdAt: '2024-01-03T12:00:00.000Z',
			authorId: '12345678abcd',
			message: '',
			minorEdit: false,
		},
		body: {},
	},
});
