import { klaviyoAuth } from '../auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const newProfileTrigger = createTrigger({
	auth: klaviyoAuth,
	name: 'klaviyo_new_profile',
	displayName: 'New Profile',
	description: 'Triggers when a new profile is created in Klaviyo.',
	type: TriggerStrategy.POLLING,
	props: {},
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
			"phone_number": "+15555555555",
			"external_id": "user_1234",
			"first_name": "Sarah",
			"last_name": "Connor",
			"organization": "Resistance",
			"title": "Commander",
			"image": "https://example.com/image.png",
			"created": "2022-11-08T00:00:00Z",
			"updated": "2022-11-08T00:00:00Z",
			"last_event_date": "2022-11-08T00:00:00Z",
			"location": {
				"address1": "123 Event St",
				"address2": "Suite 1",
				"city": "Los Angeles",
				"country": "United States",
				"region": "California",
				"zip": "90001",
				"timezone": "America/Los_Angeles"
			},
			"properties": {
				"custom_key": "custom_value"
			}
		}
	},
});

const polling: Polling<typeof klaviyoAuth, any> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth }) => {
		const client = makeClient(auth);
		const res = await client.makeRequest<any>('GET', '/profiles/', {
			'sort': '-created',
			'page[size]': '50',
		});
		return res.data.map((profile: any) => ({
			id: profile.id,
			data: profile,
			epochMilli: new Date(profile.attributes.created).getTime(),
		}));
	},
};
