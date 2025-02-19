import { intercomAuth } from '../../index';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomClient, TriggerPayload } from '../common';

export const leadAddedEmailTrigger = createTrigger({
	auth: intercomAuth,
	name: 'lead-added-email',
	displayName: 'Lead Added Email',
	description: 'Triggers when a lead enters an email address.',
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['contact.lead.added_email'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async test(context) {
		const client = intercomClient(context.auth);

		const response = await client.contacts.search({
			query: {
				field: 'role',
				operator: '=',
				value: 'lead',
			},
			pagination: { per_page: 5 },
		});

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as TriggerPayload;
		return [payload.data.item];
	},
	sampleData: {
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
});
