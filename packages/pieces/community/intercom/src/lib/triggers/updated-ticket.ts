import { intercomAuth } from '../auth';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomClient, TriggerPayload } from '../common';

export const updatedTicketTrigger = createTrigger({
	auth: intercomAuth,
	name: 'updated-ticket',
	displayName: 'Updated Ticket',
	description: 'Triggers when a ticket is updated (state or attributes change).',
	aiMetadata: {
		description:
			'Fires when an existing Intercom ticket changes, covering both ticket state transitions and ticket attribute updates. Outputs the updated ticket object.',
	},
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['ticket.state.updated', 'ticket.attribute.updated'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async test(context) {
		const client = intercomClient(context.auth);

		const response = await client.tickets.search({
			query: {
				field: 'open',
				operator: '=',
				value: 'true',
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
		type: 'ticket',
		id: '2',
		ticket_id: '1',
		ticket_attributes: {
			_default_title_: 'Cannot log in',
			_default_description_: 'Customer is unable to log in to the dashboard.',
		},
		ticket_state: 'in_progress',
		ticket_state_internal_label: 'In progress',
		ticket_state_external_label: 'In progress',
		open: true,
		category: 'Customer',
		created_at: 1739105560,
		updated_at: 1739524230,
	},
});
