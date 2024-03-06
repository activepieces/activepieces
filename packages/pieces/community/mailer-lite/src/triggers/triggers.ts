import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '..';

const subscriberSample = {
	id: '112375610569918142',
	email: 'aa@gmail.com',
	status: 'active',
	source: 'manual',
	sent: null,
	opens_count: null,
	clicks_count: null,
	open_rate: 0,
	click_rate: 0,
	ip_address: null,
	subscribed_at: '2024-02-05T21:48:53.000000Z',
	unsubscribed_at: null,
	created_at: '2024-02-05T21:48:53.000000Z',
	updated_at: '2024-02-05T21:48:53.000000Z',
	deleted_at: null,
	forget_at: null,
	fields: {
		name: 'ad',
		last_name: null,
		company: null,
		country: null,
		city: null,
		phone: null,
		state: null,
		z_i_p: null,
	},
	opted_in_at: null,
	optin_ip: null,
};

export const triggers = [
	{
		name: 'subscriber.created',
		displayName: 'Subscriber Created',
		description: 'Triggers when a subscriber was created on your mailing list.',
		sampleData: subscriberSample,
	},
	{
		name: 'subscriber.updated',
		displayName: 'Subscriber Fields Updated',
		description: 'Triggers when the subscriber fields have been updated.',
		sampleData: subscriberSample,
	},
	{
		name: 'subscriber.unsubscribed',
		displayName: 'Subscriber Unsubscribed',
		description: 'Triggers when a subscriber has unsubscribed from your mailing list.',
		sampleData: {
			id: '112374478518880188',
			email: 'example@gmail.com',
			status: 'unsubscribed',
			source: 'manual',
			sent: 0,
			opens_count: 0,
			clicks_count: 0,
			open_rate: 0,
			click_rate: 0,
			ip_address: null,
			subscribed_at: '2024-02-05 21:30:54',
			unsubscribed_at: '2024-02-05 21:54:58',
			created_at: '2024-02-05 21:30:53',
			updated_at: '2024-02-05 21:54:58',
			opted_in_at: null,
			optin_ip: null,
			email_changed_at: null,
		},
	},
	{
		name: 'subscriber.added_to_group',
		displayName: 'Subscriber Added to Group',
		description: 'Triggers when a subscriber is added to a group.',
		sampleData: {
			type: 'subscriber.added_to_group',
			subscriber: subscriberSample,
			group: { id: '108162245463115431', name: "[M]'s Network" },
		},
	},
].map(register);

export function register({
	name,
	displayName,
	description,
	sampleData,
}: {
	name: string;
	displayName: string;
	description: string;
	sampleData: unknown;
}) {
	return createTrigger({
		auth: mailerLiteAuth,
		name,
		displayName,
		description,
		props: {
			name: Property.ShortText({
				displayName: 'Webhook Name',
				required: true,
			}),
		},
		sampleData: sampleData,
		type: TriggerStrategy.WEBHOOK,
		async onEnable(context) {
			const mailerLite = new MailerLite({ api_key: context.auth });
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
				const mailerLite = new MailerLite({ api_key: context.auth });
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
