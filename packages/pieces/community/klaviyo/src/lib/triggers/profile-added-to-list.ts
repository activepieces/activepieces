import { klaviyoAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { klaviyoCommon, makeClient } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const profileAddedToListTrigger = createTrigger({
	auth: klaviyoAuth,
	name: 'klaviyo_profile_added_to_list',
	displayName: 'Profile Added to List',
	description: 'Triggers when a profile is added to a specific list in Klaviyo.',
	type: TriggerStrategy.POLLING,
	props: {
		listId: klaviyoCommon.listId(true),
	},
	onEnable: async (context) => {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			propsValue: context.propsValue,
		});
	},
	onDisable: async (context) => {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			propsValue: context.propsValue,
		});
	},
	run: async (context) => {
		return await pollingHelper.poll(polling, {
			auth: context.auth,
			propsValue: context.propsValue,
			store: context.store,
		});
	},
	test: async (context) => {
		return await pollingHelper.test(polling, {
			auth: context.auth,
			propsValue: context.propsValue,
		});
	},
	sampleData: {
		"type": "profile",
		"id": "01GD6WBY69968E7X3QY29N8XN4",
		"attributes": {
			"email": "sarah.connor@example.com",
			"first_name": "Sarah",
			"last_name": "Connor",
			"created": "2022-11-08T00:00:00Z"
		}
	},
});

const polling: Polling<typeof klaviyoAuth, { listId: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue }) => {
		const client = makeClient(auth);
		const res = await client.makeRequest<any>('GET', `/lists/${propsValue.listId}/profiles/`, {
			'sort': '-joined_group_at',
			'page[size]': '50',
		});
		return res.data.map((profile: any) => ({
			id: profile.id,
			data: profile,
			epochMilli: new Date(profile.attributes.joined_group_at || profile.attributes.created).getTime(),
		}));
	},
};
