import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../..';
import { CloseCRMOpportunityWebhookPayload } from '../common/types';
import { closeApiCall } from '../common/client';
import { verifySignature } from './helpers';

const TRIGGER_KEY = 'new-opportunity-trigger';

export const newOpportunityAdded = createTrigger({
	auth: closeAuth,
	name: 'new_opportunity_added',
	displayName: 'New Opportunity Added',
	description: 'Triggers when a new opportunity is created.',
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
						object_type: 'opportunity',
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

		const payload = context.payload.body as CloseCRMOpportunityWebhookPayload;

		// Verify this is a lead creation event
		if (payload.event.object_type !== 'opportunity' || payload.event.action !== 'created') {
			return [];
		}

		const opportunity = await closeApiCall({
			accessToken: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/opportunity/${payload.event.data.id}/`,
		});

		return [opportunity];
	},

	sampleData: {
		annualized_expected_value: 500,
		annualized_value: 1000,
		attachments: [],
		confidence: 50,
		contact_id: null,
		contact_name: null,
		created_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		created_by_name: 'john doe',
		'custom.cf_cJd1lRfCdIWTgJGLQ84lQZXiGw7ufhdXA2F907z9Mk8': 1,
		'custom.cf_gOgoyjtw8iShE434uBERAEcR6wFoacUtlVPWcPA2EXS': 'Basic',
		'custom.cf_lHRMHDYJVogylPbe6v0DCGcU7kMqz2RJUYnAhntKOOn': 10,
		'custom.cf_usm3RdC8hm7Pb6pYo9M8lKCN1h06Edij9OdzHphwAkM': [
			'Premium support',
			'Professional services',
			'Subscription',
		],
		date_created: '2025-05-30T15:53:52.829000+00:00',
		date_lost: null,
		date_updated: '2025-05-30T15:53:52.829000+00:00',
		date_won: null,
		expected_value: 500,
		id: 'oppo_NkuyMMFjRDaY5mYQ7bywfpOmiHWPQ0h02bxJoZGwTOS',
		integration_links: [],
		lead_id: 'lead_Tn9KvxpJ2InYrwOb81TIoOuAoEchLPFJS72i0xMK2vj',
		lead_name: 'TEST LEAD',
		note: 'Test',
		organization_id: 'orga_qwPaunJJ8R6NPPVQj6Q0KicVJQtyWM45dMnH9HsWZBl',
		pipeline_id: 'pipe_2kHJXqFpYKmONEWPQijcit',
		pipeline_name: 'Sales',
		status_display_name: 'Demo Completed',
		status_id: 'stat_uqaIpeqabvBXW32bpLZkcD7mhTRvCXqEF0oGQDvOKMG',
		status_label: 'Demo Completed',
		status_type: 'active',
		updated_by: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		updated_by_name: 'john doe',
		user_id: 'user_QO3f0LQE6fMbrokdE2awZLgT7pRv57S1C8Zv5Uo30TN',
		user_name: 'john doe',
		value: 1000,
		value_currency: 'USD',
		value_formatted: '$10',
		value_period: 'one_time',
	},
});
