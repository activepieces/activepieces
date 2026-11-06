import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { newBlogPostOutputSchema } from '../output-schemas';

const props = {
	spaceId: confluenceProps.spaceId({ required: true }),
};
const polling: Polling<
	AppConnectionValueForAuthProperty<typeof confluenceAuth>, { spaceId?: string }>  = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue }) {
		const results = await confluenceApi.listSpaceBlogPosts({ auth, spaceId: propsValue.spaceId });

		return results.map((post) => ({
			epochMilliSeconds: new Date(post.createdAt).getTime(),
			data: post,
		}));
	},
};

export const newBlogPostTrigger = createTrigger({
	name: 'new-blog-post',
	outputSchema: newBlogPostOutputSchema,
	classification: 'READ',
	displayName: 'New Blog Post',
	description: 'Triggers when a new blog post is published in the selected space.',
	aiMetadata: {
		description: 'Fires when a new blog post is created in the selected Confluence space. Each event represents one newly published blog post with its metadata.',
	},
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
