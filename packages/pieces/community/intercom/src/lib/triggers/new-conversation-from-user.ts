import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { intercomAuth } from '../..';
import { intercomClient, TriggerPayload } from '../common';

export const newConversationFromUser = createTrigger({
	name: 'newConversationFromUser',
	displayName: 'New Conversation',
	description: 'Triggers when a conversation is created by a user or lead (not an admin).',
	props: {},
	auth: intercomAuth,
	type: TriggerStrategy.APP_WEBHOOK,
	async onEnable(context) {
		const client = intercomClient(context.auth);
		const response = await client.admins.identify();

		if (!response.app?.id_code) {
			throw new Error('Could not find admin id code');
		}

		context.app.createListeners({
			events: ['conversation.user.created'],
			identifierValue: response['app']['id_code'],
		});
	},
	async onDisable(context) {
		// implement webhook deletion logic
	},
	async test(context) {
		const client = intercomClient(context.auth);

		const response = await client.conversations.list({ per_page: 10 });

		return response.data;
	},
	async run(context) {
		const payload = context.payload.body as TriggerPayload;
		return [payload.data.item];
	},
	sampleData: {
		type: 'conversation',
		id: '2',
		created_at: 1739105560,
		updated_at: 1739524230,
		waiting_since: null,
		snoozed_until: null,
		source: {
			type: null,
			id: '2',
			delivered_as: 'admin_initiated',
			subject: '',
			body: '',
			author: {
				type: 'admin',
				id: '8055721',
				name: 'Fin',
				email: 'operator+k2gbyfxu@intercom.io',
			},
			attachments: [],
			url: null,
			redacted: false,
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
		first_contact_reply: null,
		admin_assignee_id: 8055717,
		team_assignee_id: null,
		open: true,
		state: 'open',
		read: false,
		tags: {
			type: 'tag.list',
			tags: [],
		},
		priority: 'not_priority',
		sla_applied: null,
		statistics: {
			type: 'conversation_statistics',
			time_to_assignment: null,
			time_to_admin_reply: null,
			time_to_first_close: null,
			time_to_last_close: null,
			median_time_to_reply: null,
			first_contact_reply_at: null,
			first_assignment_at: null,
			first_admin_reply_at: null,
			first_close_at: null,
			last_assignment_at: null,
			last_assignment_admin_reply_at: null,
			last_contact_reply_at: null,
			last_admin_reply_at: null,
			last_close_at: null,
			last_closed_by_id: null,
			count_reopens: 0,
			count_assignments: 0,
			count_conversation_parts: 9,
		},
		conversation_rating: null,
		teammates: {
			type: 'admin.list',
			admins: [
				{
					type: 'admin',
					id: '8055717',
				},
			],
		},
		title: null,
		custom_attributes: {
			'Copilot used': false,
			'Ticket category': 'Customer ticket',
			'Created by': 8055721,
		},
		topics: {
			type: 'topic.list',
			topics: [],
			total_count: 0,
		},
		ticket: {
			type: 'ticket',
			id: 2,
			url: 'https://app.intercom.com/a/apps/ahah/conversations/2',
			custom_attributes: {
				_default_title_: {
					value: 'fdfdf',
					type: 'string',
				},
				_default_description_: {
					value: 'dfdfdf',
					type: 'string',
				},
				List: {
					value: null,
					type: 'list',
				},
				Number: {
					value: null,
					type: 'integer',
				},
				decimal: {
					value: null,
					type: 'decimal',
				},
				bool: {
					value: null,
					type: 'boolean',
				},
				'date time': {
					value: null,
					type: 'datetime',
				},
				files: {
					value: null,
					type: 'files',
				},
			},
			state: 'in_progress',
			ticket_type: 'zapier',
			ticket_type_description: '',
			ticket_type_emoji: '🚨',
			ticket_custom_state_admin_label: 'In progress',
			ticket_custom_state_user_label: 'In progress',
		},
		linked_objects: {
			type: 'list',
			data: [],
			total_count: 0,
			has_more: false,
		},
		ai_agent: null,
		ai_agent_participated: false,
	},
});
