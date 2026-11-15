import { closeOutputSchemas } from '../common/output-schemas';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { closeAuth } from '../auth';
import { closeCreatedTriggerHooks } from './helpers';

export const newContactAdded = createTrigger({
	auth: closeAuth,
	name: 'new_contact_added',
	displayName: 'New Contact Added',
	description: 'Triggers when a new contact is created.',
	aiMetadata: { description: 'Fires when a new contact (person) is created in Close CRM, via a registered webhook on the contact-created event. Emits the full contact record, including its parent lead ID. Use to react whenever a person is added to the CRM. Close retries failed deliveries for up to 72 hours; repeated deliveries of the same event are ignored.' },
	classification: 'READ',
	type: TriggerStrategy.WEBHOOK,
	props: {},
	outputSchema: closeOutputSchemas.raw.contact,
	...closeCreatedTriggerHooks({ storeKey: 'new-contact-trigger', objectType: 'contact' }),
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
