import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { BASE_URL } from '../common';
import {
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import { circleAuth } from '../common/auth';

import dayjs from 'dayjs';
import { ListCommunityMembersResponse } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof circleAuth>, Record<string, any>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		let page = 1;
		let hasMorePages = true;
		let stopFetching = false;

		const members = [];

		do {
			const response = await httpClient.sendRequest<ListCommunityMembersResponse>({
				method: HttpMethod.GET,
				url: `${BASE_URL}/community_members`,
				queryParams: {
					page: page.toString(),
					per_page: '50',
					status: 'all',
				},
				headers: {
					Authorization: `Bearer ${auth}`,
					'Content-Type': 'application/json',
				},
			});

			const items = response.body.records || [];

			for (const member of items) {
				const publishedAt = dayjs(member.created_at).valueOf();

				if (publishedAt < lastFetchEpochMS) {
					stopFetching = true;
					break;
				}

				members.push(member);
			}

			if (stopFetching || lastFetchEpochMS === 0) break;

			page++;
			hasMorePages = response.body.has_next_page;
		} while (hasMorePages);

		return members.map((member) => {
			return {
				epochMilliSeconds: dayjs(member.created_at).valueOf(),
				data: member,
			};
		});
	},
};

export const newMemberAdded = createTrigger({
	auth: circleAuth,
	name: 'new_member_added',
	displayName: 'New Member Added',
	description: 'Triggers when a new member is added to the community.',
	props: {},
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
		first_name: 'Gov.',
		last_name: 'Loriann Barton',
		headline: 'Sales Orchestrator',
		created_at: '2024-09-03T16:20:19.814Z',
		updated_at: '2024-09-03T16:20:19.826Z',
		community_id: 1,
		last_seen_at: null,
		profile_confirmed_at: '2024-09-03T16:20:19.000Z',
		id: 2,
		profile_url: 'http://reynolds.circledev.net:31337/u/352c3aff',
		public_uid: '352c3aff',
		profile_fields: [],
		flattened_profile_fields: {
			profile_field_key_1: null,
		},
		avatar_url: null,
		user_id: 3,
		name: 'Gov. Loriann Barton',
		email: 'raul@nitzsche.org',
		accepted_invitation: '2024-09-03 16:20:19 UTC',
		active: true,
		sso_provider_user_id: null,
		member_tags: [],
		posts_count: 0,
		comments_count: 0,
		gamification_stats: {
			community_member_id: 2,
			total_points: 0,
			current_level: 1,
			current_level_name: 'Level 1',
			points_to_next_level: 50,
			level_progress: 50,
		},
	},
});
