import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { BASE_URL, spaceIdDropdown } from '../common';
import {
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import { circleAuth } from '../common/auth';
import { ListBasicPostsResponse } from '../common/types';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof circleAuth>, { space_id?: number }> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const spaceId = propsValue.space_id!;

		let page = 1;
		let hasMorePages = true;
		let stopFetching = false;

		const posts = [];

		do {
			const response = await httpClient.sendRequest<ListBasicPostsResponse>({
				method: HttpMethod.GET,
				url: `${BASE_URL}/posts`,
				queryParams: {
					space_id: spaceId.toString(),
					status: 'published',
					sort: 'latest',
					page: page.toString(),
					per_page: '60',
				},
				headers: {
					Authorization: `Bearer ${auth}`,
					'Content-Type': 'application/json',
				},
			});

			const items = response.body.records || [];

			for (const post of items) {
				const publishedAt = dayjs(post.published_at).valueOf();

				if (publishedAt < lastFetchEpochMS) {
					stopFetching = true;
					break;
				}

				posts.push(post);
			}

			if (stopFetching || lastFetchEpochMS === 0) break;

			page++;
			hasMorePages = response.body.has_next_page;
		} while (hasMorePages);

		return posts.map((post) => {
			return {
				epochMilliSeconds: dayjs(post.published_at).valueOf(),
				data: post,
			};
		});
	},
};

export const newPostCreated = createTrigger({
	auth: circleAuth,
	name: 'new_post_created',
	displayName: 'New Post Created',
	description: 'Triggers when a new post is created in a specific space.',
	props: {
		space_id: spaceIdDropdown,
	},
	type: TriggerStrategy.POLLING,
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
		id: 2,
		status: 'published',
		name: 'Second post',
		slug: 'kiehn',
		comments_count: 0,
		hide_meta_info: false,
		published_at: '2024-06-27T08:31:30.777Z',
		created_at: '2024-06-27T08:31:30.781Z',
		updated_at: '2024-06-27T08:31:30.784Z',
		is_comments_enabled: true,
		is_liking_enabled: true,
		flagged_for_approval_at: null,
		body: {
			id: 2,
			name: 'body',
			body: '<div><!--block-->Iusto sint asperiores sed.</div>',
			record_type: 'Post',
			record_id: 2,
			created_at: '2024-06-27T08:31:30.000Z',
			updated_at: '2024-06-27T08:31:30.000Z',
		},
		url: 'http://dickinson.circledev.net:31337/c/post/kiehn',
		space_name: 'post',
		space_slug: 'post',
		space_id: 1,
		user_id: 6,
		user_email: 'lyndon@frami.info',
		user_name: 'Rory Wyman',
		community_id: 1,
		user_avatar_url: 'https://example.com/avatar.png',
		cover_image_url: 'http://example.com/cover.jpeg',
		cover_image: 'identifier-string',
		cardview_thumbnail_url: 'http://example.com/thumbnail.jpeg',
		cardview_thumbnail: 'identifier-string',
		is_comments_closed: false,
		custom_html: '<div>Click Me!</div>',
		likes_count: 0,
		member_posts_count: 2,
		member_comments_count: 0,
		member_likes_count: 0,
		topics: [12, 43, 54],
	},
});
