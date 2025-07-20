import { intercomAuth } from '../../index';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomClient, TriggerPayload } from '../common';

export const newTicketTrigger = createTrigger({
	auth: intercomAuth,
	name: 'new-ticket',
	displayName: 'New Ticket',
	description: 'Triggers when a new ticket is created.',
	props: {},
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['ticket.created'],
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
			_default_title_: 'fdfdf',
			_default_description_: 'dfdfdf',
			List: null,
			Number: null,
			decimal: null,
			bool: null,
			'date time': null,
			files: [],
		},
		ticket_state: 'in_progress',
		ticket_type: {
			type: 'ticket_type',
			id: '1',
			name: 'test',
			description: '',
			icon: '🚨',
			workspace_id: 'nzekhfwb',
			archived: false,
			created_at: 1739105534,
			updated_at: 1739105534,
			is_internal: false,
			ticket_type_attributes: {
				type: 'list',
				data: [
					{
						type: 'ticket_type_attribute',
						id: '6615713',
						workspace_id: 'nzekhfwb',
						name: '_default_title_',
						description: '',
						data_type: 'string',
						input_options: {
							multiline: false,
						},
						order: 0,
						required_to_create: false,
						required_to_create_for_contacts: false,
						visible_on_create: true,
						visible_to_contacts: true,
						default: true,
						ticket_type_id: 1,
						archived: false,
						created_at: 1739105534,
						updated_at: 1739105534,
					},
					{
						type: 'ticket_type_attribute',
						id: '6615714',
						workspace_id: 'nzekhfwb',
						name: '_default_description_',
						description: '',
						data_type: 'string',
						input_options: {
							multiline: true,
						},
						order: 1,
						required_to_create: false,
						required_to_create_for_contacts: false,
						visible_on_create: true,
						visible_to_contacts: true,
						default: true,
						ticket_type_id: 1,
						archived: false,
						created_at: 1739105534,
						updated_at: 1739105534,
					},
				],
			},
			category: 'Customer',
		},
		contacts: {
			type: 'contact.list',
			contacts: [
				{
					type: 'contact',
					id: '67a87380c16da6b56c76bbb7',
					external_id: '1234567',
				},
			],
		},
		admin_assignee_id: '8055717',
		team_assignee_id: '0',
		created_at: 1739105560,
		updated_at: 1739524230,
		ticket_parts: {
			type: 'ticket_part.list',
			ticket_parts: [
				{
					type: 'ticket_part',
					id: '3',
					part_type: 'ticket_state_updated_by_admin',
					ticket_state: 'submitted',
					previous_ticket_state: 'submitted',
					created_at: 1739105561,
					updated_at: 1739105561,
					author: {
						id: '8055721',
						type: 'bot',
						name: 'Fin',
						email: 'operator+k2gbyfxu@intercom.io',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '5',
					part_type: 'assignment',
					body: '<p class="no-margin">hghh</p>',
					created_at: 1739109004,
					updated_at: 1739111399,
					assigned_to: {
						type: 'admin',
						id: '8055717',
					},
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '6',
					part_type: 'conversation_tags_updated',
					created_at: 1739109007,
					updated_at: 1739109007,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '7',
					part_type: 'conversation_tags_updated',
					created_at: 1739109008,
					updated_at: 1739109008,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '14',
					part_type: 'conversation_tags_updated',
					created_at: 1739111399,
					updated_at: 1739111399,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '15',
					part_type: 'conversation_tags_updated',
					created_at: 1739111400,
					updated_at: 1739111400,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '16',
					part_type: 'comment',
					body: '<p class="no-margin">ss</p>',
					created_at: 1739111407,
					updated_at: 1739111407,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
				{
					type: 'ticket_part',
					id: '37',
					part_type: 'ticket_state_updated_by_admin',
					ticket_state: 'in_progress',
					previous_ticket_state: 'submitted',
					created_at: 1739524230,
					updated_at: 1739524230,
					author: {
						id: '8055717',
						type: 'admin',
						name: 'John Doe',
						email: 'johndoe@gmail.com',
					},
					attachments: [],
					redacted: false,
				},
			],
			total_count: 8,
		},
		open: true,
		linked_objects: {
			type: 'list',
			data: [],
			total_count: 0,
			has_more: false,
		},
		category: 'Customer',
		is_shared: true,
		company_id: '67a8a24c4670c9f1995b2382',
		ticket_state_internal_label: 'In progress',
		ticket_state_external_label: 'In progress',
	},
});
