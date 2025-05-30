import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMContactWebhookPayload } from '../common/types';
import { closeApiCall } from '../common/client';
import { verifySignature } from './helpers';

const TRIGGER_KEY = 'new-contact-trigger';

export const newContactAdded = createTrigger({
	auth: closeAuth,
	name: 'new_contact_added',
	displayName: 'New Contact Added',
	description: 'Triggers when a new contact is created.',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	async onEnable(context) {
		const response = await closeApiCall<{ id: string; signature_key: string }>({
			accessToken: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/webhook/',
			body: {
				url: context.webhookUrl,
				events: [
					{
						object_type: 'contact',
						action: 'created',
					},
				],
			},
		});

		const { id, signature_key: signatureKey } = response;
		await context.store.put<{ id: string; signatureKey: string }>(TRIGGER_KEY, {
			id,
			signatureKey,
		});
	},

	async onDisable(context) {
		const triggerData = await context.store.get<{
			id: string;
			signatureKey: string;
		}>(TRIGGER_KEY);

		if (triggerData?.id) {
			await closeApiCall({
				method: HttpMethod.DELETE,
				accessToken: context.auth,
				resourceUri: `/webhook/${triggerData.id}`,
			});
		}

		await context.store.delete(TRIGGER_KEY);
	},

	async run(context) {
		const triggerData = await context.store.get<{
			id: string;
			signatureKey: string;
		}>(TRIGGER_KEY);

		const signatureKey = triggerData?.signatureKey;
		const signatureHash = context.payload.headers['close-sig-hash'];
		const timestamp = context.payload.headers['close-sig-timestamp'];
		const rawBody = context.payload.rawBody;

		if (!verifySignature(signatureKey, timestamp, rawBody, signatureHash)) {
			return [];
		}

		const payload = context.payload.body as CloseCRMContactWebhookPayload;

		// Verify this is a lead creation event
		if (payload.event.object_type !== 'contact' || payload.event.action !== 'created') {
			return [];
		}

		const contact = await closeApiCall({
			accessToken: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/contact/${payload.event.data.id}/`,
		});

		return [contact];
	},

	sampleData: {
		created_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		date_created: '2025-05-30T15:29:16.048000+00:00',
		date_updated: '2025-05-30T15:29:16.048000+00:00',
		display_name: 'John Doe',
		emails: [
			{
				email: 'johndoe@gmail.com',
				is_unsubscribed: false,
				type: 'office',
			},
			{
				email: 'johndoe@gmail.com',
				is_unsubscribed: false,
				type: 'direct',
			},
		],
		id: 'cont_SNLEuIxMqrgu23m1D63rnE84ivTYlXm3pPRJXHWhGqn',
		integration_links: [
			{
				name: 'LinkedIn Search',
				url: 'https://www.linkedin.com/search/results/people/?keywords=JohnDoe',
			},
		],
		lead_id: 'lead_Tn9KvxpJ2InYrwOb81TIoOuAoEchLPFJS72i0xMK2vj',
		name: 'John Doe',
		organization_id: 'orga_qwPaunJJ8R6NPPVQj6Q0KicVJQtyWM45dMnH9HsWZBl',
		phones: [
			{
				country: 'IN',
				phone: '',
				phone_formatted: '+911541',
				type: 'mobile',
			},
		],
		title: 'Test',
		updated_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		urls: [
			{
				type: 'url',
				url: 'https://www.github.com',
			},
		],
	},
});
