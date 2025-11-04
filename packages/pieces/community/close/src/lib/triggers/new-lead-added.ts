import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMLeadWebhookPayload } from '../common/types';
import { closeApiCall } from '../common/client';
import { verifySignature } from './helpers';

const TRIGGER_KEY = 'new-lead-trigger';

export const newLeadAdded = createTrigger({
	auth: closeAuth,
	name: 'new_lead_created',
	displayName: 'New Lead Created',
	description: 'Triggers when a new lead is created.',
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
						object_type: 'lead',
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

		const payload = context.payload.body as CloseCRMLeadWebhookPayload;

		// Verify this is a lead creation event
		if (payload.event.object_type !== 'lead' || payload.event.action !== 'created') {
			return [];
		}

		const lead = await closeApiCall({
			accessToken: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/lead/${payload.event.data.id}/`,
		});

		return [lead];
	},

	sampleData: {
		addresses: [],
		contacts: [
			{
				created_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
				date_created: '2025-05-30T15:30:40.148000+00:00',
				date_updated: '2025-05-30T15:30:40.148000+00:00',
				display_name: 'John Doe',
				emails: [
					{
						email: 'johndoe@gmail.com',
						is_unsubscribed: false,
						type: 'office',
					},
				],
				id: 'cont_p9jX6fiJ0AryAx06CwT9SY8OyA9PX29zmwXBw9ct3TR',
				lead_id: 'lead_fy3zdUuEFQ1WJEi846CGSvpePgzqm0P6XTPRDtSBFTC',
				name: 'John Doe',
				organization_id: 'orga_qwPaunJJ8R6NPPVQj6Q0KicVJQtyWM45dMnH9HsWZBl',
				phones: [
					{
						country: 'IN',
						phone: '+91754',
						phone_formatted: '+91754',
						type: 'office',
					},
				],
				title: 'SDE',
				updated_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
				urls: [
					{
						type: 'url',
						url: 'https://www.github.com',
					},
				],
			},
		],
		created_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		created_by_name: 'John Doe',
		custom: {
			'Current Vendor/Software': 'Close',
			'Custom Field': 'test',
			Industry: 'Healthcare',
			date: '2025-05-30',
			datetime: '2025-05-30T00:00:00+00:00',
		},
		date_created: '2025-05-30T15:30:40.122000+00:00',
		date_updated: '2025-05-30T15:35:33.131000+00:00',
		description: 'TESTING',
		display_name: 'John Doe',
		id: 'lead_fy3zdUuEFQ1WJEi846CGSvpePgzqm0P6XTPRDtSBFTC',
		integration_links: [
			{
				name: 'Google Search',
				url: 'https://google.com/search?q=HEllo%20KNOW',
			},
		],
		name: 'John Doe',
		opportunities: [],
		organization_id: 'orga_qwPaunJJ8R6NPPVQj6Q0KicVJQtyWM45dMnH9HsWZBl',
		status_id: 'stat_piNPXI7AsUxHHwhPJKdCTiQtZsRP96HGb088FzJCgEJ',
		status_label: 'Potential',
		tasks: [],
		updated_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		updated_by_name: 'John Doe',
		url: 'https://www.github.com',
	},
});
