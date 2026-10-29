import { closeOutputSchemas } from '../common/output-schemas';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { closeAuth } from '../auth';
import { closeCreatedTriggerHooks } from './helpers';

export const newLeadAdded = createTrigger({
	auth: closeAuth,
	name: 'new_lead_created',
	displayName: 'New Lead Created',
	description: 'Triggers when a new lead is created.',
	aiMetadata: { description: 'Fires when a new lead (company/account) is created in Close CRM, via a registered webhook on the lead-created event. Emits the full lead record. Use to start a flow whenever a prospect or account enters the CRM. Close retries failed deliveries for up to 72 hours; repeated deliveries of the same event are ignored.' },
	classification: 'READ',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	outputSchema: closeOutputSchemas.raw.lead,
	...closeCreatedTriggerHooks({ storeKey: 'new-lead-trigger', objectType: 'lead' }),
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
