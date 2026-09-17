import MailerLite from '@mailerlite/mailerlite-nodejs';
import { OutputSchema, createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../lib/auth';
import {
	subscriberAddedToGroupTriggerOutputSchema,
	subscriberEventTriggerOutputSchema,
} from '../lib/output-schemas';

const subscriberSample = {
	"id": "112375610569918142",
	"email": "subscriber@example.com",
	"status": "active",
	"source": "api",
	"sent": 0,
	"opens_count": 0,
	"clicks_count": 0,
	"open_rate": 0,
	"click_rate": 0,
	"ip_address": null,
	"subscribed_at": "2026-08-27T15:06:41.000000Z",
	"unsubscribed_at": null,
	"created_at": "2026-08-27T15:06:41.000000Z",
	"updated_at": "2026-08-27T15:06:41.000000Z",
	"deleted_at": null,
	"forget_at": null,
	"fields": {
		"name": "Hook",
		"last_name": "Probe",
		"company": null,
		"country": null,
		"city": null,
		"phone": null,
		"state": null,
		"z_i_p": null,
		"loyalty_tier": null
	},
	"opted_in_at": null,
	"optin_ip": null,
	"location": null,
	"event": "subscriber.created",
	"account_id": 2599924,
	"api_version": "2025-05"
};

export const triggers = [
	{
		name: 'subscriber.created',
		outputSchema: subscriberEventTriggerOutputSchema,
		displayName: 'Subscriber Created',
		description: 'Triggers when a subscriber was created on your mailing list.',
		aiMetadata: {
			description:
				'Fires when a new subscriber is added to the MailerLite account, regardless of source (manual, form, import, API). Represents a newly created contact and carries the subscriber record.',
		},
		sampleData: subscriberSample,
	},
	{
		name: 'subscriber.updated',
		outputSchema: subscriberEventTriggerOutputSchema,
		displayName: 'Subscriber Fields Updated',
		description: 'Triggers when the subscriber fields have been updated.',
		aiMetadata: {
			description:
				"Fires when an existing subscriber's fields (name, custom fields, or other profile attributes) are changed. Represents an update to a contact's record and carries the updated subscriber.",
		},
		sampleData: subscriberSample,
	},
	{
		name: 'subscriber.unsubscribed',
		outputSchema: subscriberEventTriggerOutputSchema,
		displayName: 'Subscriber Unsubscribed',
		description: 'Triggers when a subscriber has unsubscribed from your mailing list.',
		aiMetadata: {
			description:
				'Fires when a subscriber unsubscribes from the mailing list, with their status set to unsubscribed. Represents a contact opting out and carries the affected subscriber.',
		},
		sampleData: {
			"id": "112375610569918142",
			"email": "subscriber@example.com",
			"status": "unsubscribed",
			"source": "api",
			"sent": 0,
			"opens_count": 0,
			"clicks_count": 0,
			"open_rate": 0,
			"click_rate": 0,
			"ip_address": null,
			"subscribed_at": "2026-08-27T15:06:41.000000Z",
			"unsubscribed_at": "2026-08-27T15:10:00.000000Z",
			"created_at": "2026-08-27T15:06:41.000000Z",
			"updated_at": "2026-08-27T15:06:41.000000Z",
			"deleted_at": null,
			"forget_at": null,
			"fields": {
				"name": "Hook",
				"last_name": "Probe",
				"company": null,
				"country": null,
				"city": null,
				"phone": null,
				"state": null,
				"z_i_p": null,
				"loyalty_tier": null
			},
			"opted_in_at": null,
			"optin_ip": null,
			"location": null,
			"event": "subscriber.unsubscribed",
			"account_id": 2599924,
			"api_version": "2025-05"
		},
	},
	{
		name: 'subscriber.added_to_group',
		outputSchema: subscriberAddedToGroupTriggerOutputSchema,
		displayName: 'Subscriber Added to Group',
		description: 'Triggers when a subscriber is added to a group.',
		aiMetadata: {
			description:
				'Fires when a subscriber is assigned to a group/segment. Represents group membership being granted and carries both the subscriber and the group it was added to.',
		},
		sampleData: {
			"type": "subscriber.added_to_group",
			"subscriber": {
				"id": "112375610569918142",
				"email": "subscriber@example.com",
				"status": "active",
				"source": "api",
				"sent": 0,
				"opens_count": 0,
				"clicks_count": 0,
				"open_rate": 0,
				"click_rate": 0,
				"ip_address": null,
				"subscribed_at": "2026-08-27T15:06:41.000000Z",
				"unsubscribed_at": null,
				"created_at": "2026-08-27T15:06:41.000000Z",
				"updated_at": "2026-08-27T15:06:46.000000Z",
				"deleted_at": null,
				"forget_at": null,
				"fields": {
					"name": "Hook-Updated",
					"last_name": "Probe",
					"company": null,
					"country": null,
					"city": null,
					"phone": null,
					"state": null,
					"z_i_p": null,
					"loyalty_tier": null
				},
				"opted_in_at": null,
				"optin_ip": null,
				"location": null
			},
			"group": {
				"id": "196965768156415638",
				"name": "AP Capture Group"
			},
			"account_id": 2599924,
			"api_version": "2025-05"
		},
	},
].map(register);

export function register({
	name,
	displayName,
	description,
	aiMetadata,
	sampleData,
	outputSchema,
}: {
	name: string;
	displayName: string;
	description: string;
	aiMetadata: { description: string };
	sampleData: unknown;
	outputSchema: OutputSchema;
}) {
	return createTrigger({
		auth: mailerLiteAuth,
		name,
		classification: 'READ',
		displayName,
		description,
		aiMetadata,
		props: {
			name: Property.ShortText({
				displayName: 'Webhook Name',
				required: true,
			}),
		},
		sampleData: sampleData,
		outputSchema,
		type: TriggerStrategy.WEBHOOK,
		async onEnable(context) {
			const mailerLite = new MailerLite({ api_key: context.auth.secret_text });
			mailerLite.webhooks
				.create({
					name: context.propsValue.name,
					events: [name],
					url: context.webhookUrl,
				})
				.then(async (response) => {
					await context.store.put<Webhook>(name, response.data);
				})
				.catch((error) => {
					if (error.response) console.log(error.response.data);
				});
		},
		async onDisable(context) {
			const webhook = await context.store.get<Webhook>(name);

			if (webhook?.data.id) {
				const mailerLite = new MailerLite({ api_key: context.auth.secret_text });
				mailerLite.webhooks.delete(webhook?.data.id);
			}
		},
		async run(context) {
			return [context.payload.body];
		},
	});
}

interface Webhook {
	data: {
		id: string;
		name: string;
		url: string;
		events: string[];
		enabled: boolean;
		secret: string;
		created_at: string;
		updated_at: string;
	};
}
