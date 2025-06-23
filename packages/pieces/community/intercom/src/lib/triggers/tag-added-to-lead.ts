import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient } from '../common';
import { tagIdProp } from '../common/props';

export const tagAddedToLeadTrigger = createTrigger({
	name: 'tag-added-to-lead',
	displayName: 'Tag Added to Lead',
	description: 'Triggers when a tag is added to a lead.',
	props: {
		tagId: tagIdProp('Tag', false),
	},
	auth: intercomAuth,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['contact.lead.tag.created'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async test(context) {
		const client = intercomClient(context.auth);

		if (context.propsValue.tagId) {
			const response = await client.contacts.search({
				query: {
					operator: 'AND',
					value: [
						{
							field: 'tag_id',
							operator: '=',
							value: context.propsValue.tagId,
						},
						{
							field: 'role',
							operator: '=',
							value: 'lead',
						},
					],
				},
				pagination: { per_page: 5 },
			});

			const tag = await client.tags.find({ tag_id: context.propsValue.tagId });

			return response.data.map((item) => {
				return {
					type: 'contact_tag',
					tag: {
						type: tag.type,
						id: tag.id,
						name: tag.name,
					},
					contact: item,
				};
			});
		}

		const response = await client.contacts.search({
			query: {
				operator: 'AND',
				value: [
					{
						field: 'tag_id',
						operator: '!=',
						value: '',
					},
					{
						field: 'role',
						operator: '=',
						value: 'lead',
					},
				],
			},
			pagination: { per_page: 100 },
		});

		let count = 0;
		const items = [];
		for await (const lead of response) {
			if (lead.tags && lead.tags.data.length > 0) {
				const tag = await client.tags.find({ tag_id: lead.tags.data[0].id });
				items.push({
					type: 'contact_tag',
					tag: {
						type: tag.type,
						id: tag.id,
						name: tag.name,
					},
					contact: lead,
				});
				count++;
			}

			if (count >= 5) break;
		}

		return items;
	},
	async run(context) {
		const tag = context.propsValue.tagId;
		const payloadBody = context.payload.body as IntercomPayloadBodyType;
		if (!tag || payloadBody?.data?.item?.tag.id === tag) {
			return [payloadBody.data.item];
		}
		return [];
	},
	sampleData: {
		type: 'contact_tag',
		tag: {
			type: 'tag',
			id: '34',
			name: 'Manual tag',
		},
		contact: {
			type: 'contact',
			id: '67a9b9dfcc14109e073fbe19',
			workspace_id: 'nzekhfwb',
			external_id: '5b803f65-bcec-4198-b4f4-a0588454b537',
			role: 'lead',
			email: 'john.doe@example.com',
			phone: null,
			name: 'John Doe',
			avatar: null,
			owner_id: null,
			social_profiles: {
				type: 'list',
				data: [],
			},
			has_hard_bounced: false,
			marked_email_as_spam: false,
			unsubscribed_from_emails: false,
			created_at: '2025-02-10T08:33:35.910+00:00',
			updated_at: '2025-02-10T08:33:35.907+00:00',
			signed_up_at: null,
			last_seen_at: null,
			last_replied_at: null,
			last_contacted_at: null,
			last_email_opened_at: null,
			last_email_clicked_at: null,
			language_override: null,
			browser: null,
			browser_version: null,
			browser_language: null,
			os: null,
			location: {
				type: 'location',
				country: null,
				region: null,
				city: null,
				country_code: null,
				continent_code: null,
			},
			android_app_name: null,
			android_app_version: null,
			android_device: null,
			android_os_version: null,
			android_sdk_version: null,
			android_last_seen_at: null,
			ios_app_name: null,
			ios_app_version: null,
			ios_device: null,
			ios_os_version: null,
			ios_sdk_version: null,
			ios_last_seen_at: null,
			custom_attributes: {},
			tags: {
				type: 'list',
				data: [],
				url: '/contacts/67a9b9dfcc14109e073fbe19/tags',
				total_count: 0,
				has_more: false,
			},
			notes: {
				type: 'list',
				data: [],
				url: '/contacts/67a9b9dfcc14109e073fbe19/notes',
				total_count: 0,
				has_more: false,
			},
			companies: {
				type: 'list',
				data: [],
				url: '/contacts/67a9b9dfcc14109e073fbe19/companies',
				total_count: 0,
				has_more: false,
			},
			opted_out_subscription_types: {
				type: 'list',
				data: [],
				url: '/contacts/67a9b9dfcc14109e073fbe19/subscriptions',
				total_count: 0,
				has_more: false,
			},
			opted_in_subscription_types: {
				type: 'list',
				data: [],
				url: '/contacts/67a9b9dfcc14109e073fbe19/subscriptions',
				total_count: 0,
				has_more: false,
			},
			utm_campaign: null,
			utm_content: null,
			utm_medium: null,
			utm_source: null,
			utm_term: null,
			referrer: null,
			sms_consent: false,
			unsubscribed_from_sms: false,
			enabled_push_messaging: null,
		},
	},
});

type IntercomPayloadBodyType = {
	data: {
		item: {
			tag: {
				id: string;
			};
		};
	};
};
