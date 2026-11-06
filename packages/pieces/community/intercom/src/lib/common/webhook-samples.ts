import { HttpMethod } from '@activepieces/pieces-common';
import { intercomRequest, IntercomAuthValue } from './client';

export async function recentConversationEnvelopes({
	auth,
	topic,
}: {
	auth: IntercomAuthValue;
	topic: string;
}): Promise<Record<string, unknown>[]> {
	const list = await intercomRequest<{ conversations?: Array<{ id: string }> }>({
		auth,
		method: HttpMethod.GET,
		path: ['conversations'],
		query: { per_page: 3 },
		operation: 'list recent conversations',
	});
	const recent = (list.conversations ?? []).slice(0, 3);
	const conversations = await Promise.all(
		recent.map((conversation) =>
			intercomRequest<Record<string, unknown>>({
				auth,
				method: HttpMethod.GET,
				path: ['conversations', conversation.id],
				operation: 'get the conversation',
			}),
		),
	);
	return conversations.map((item) => toEnvelope({ topic, item }));
}

export function conversationEnvelopeSample(topic: string): Record<string, unknown> {
	return toEnvelope({ topic, item: CONVERSATION_ITEM_SAMPLE });
}

function toEnvelope({ topic, item }: { topic: string; item: Record<string, unknown> }): Record<string, unknown> {
	return {
		type: 'notification_event',
		app_id: 'abc12345',
		id: 'notif_0f4c2b9e-1d1b-4a77-9f3e-9b0c1f0e2a11',
		topic,
		delivery_status: 'pending',
		delivery_attempts: 1,
		delivered_at: 0,
		first_sent_at: 1739524230,
		created_at: 1739524230,
		data: { type: 'notification_event_data', item },
	};
}

const CONVERSATION_ITEM_SAMPLE: Record<string, unknown> = {
	type: 'conversation',
	id: '2',
	title: null,
	created_at: 1739105560,
	updated_at: 1739524230,
	waiting_since: null,
	snoozed_until: null,
	open: true,
	state: 'open',
	read: true,
	priority: 'not_priority',
	admin_assignee_id: 8016437,
	team_assignee_id: null,
	tags: { type: 'tag.list', tags: [] },
	conversation_rating: null,
	source: {
		type: 'conversation',
		id: '2',
		delivered_as: 'customer_initiated',
		subject: '',
		body: '<p>Hi, I cannot log in to the dashboard.</p>',
		author: { type: 'user', id: '67a9b9dfcc14109e073fbe19', name: 'John Doe', email: 'john.doe@example.com' },
		attachments: [],
		url: null,
		redacted: false,
	},
	contacts: {
		type: 'contact.list',
		contacts: [{ type: 'contact', id: '67a9b9dfcc14109e073fbe19', external_id: '5b803f65-bcec-4198-b4f4-a0588454b537' }],
	},
	statistics: {
		type: 'conversation_statistics',
		first_admin_reply_at: 1739105600,
		last_close_at: null,
		count_reopens: 0,
		count_conversation_parts: 3,
	},
	custom_attributes: {},
	ai_agent_participated: false,
	conversation_parts: {
		type: 'conversation_part.list',
		conversation_parts: [
			{
				type: 'conversation_part',
				id: '101',
				part_type: 'comment',
				body: '<p>Thanks, we are looking into it.</p>',
				created_at: 1739524230,
				updated_at: 1739524230,
				notified_at: 1739524230,
				assigned_to: null,
				author: { type: 'admin', id: '8016437', name: 'Pat Lee', email: 'pat@example.com' },
				attachments: [],
				external_id: null,
				redacted: false,
			},
		],
		total_count: 1,
	},
};

export const COMPANY_SAMPLE: Record<string, unknown> = {
	type: 'company',
	company_id: 'acme-001',
	id: '67a9c1b2cc14109e073fbe55',
	app_id: 'abc12345',
	name: 'Acme Inc',
	remote_created_at: null,
	created_at: '2025-02-09T12:52:40.000+00:00',
	updated_at: '2025-02-09T12:52:40.000+00:00',
	last_request_at: null,
	size: 120,
	website: 'https://acme.example.com',
	industry: 'Software',
	monthly_spend: 500,
	session_count: 0,
	user_count: 0,
	plan: { type: 'plan', id: '1', name: 'Pro' },
	custom_attributes: {},
	tag_ids: [],
};

export const CONVERSATION_PART_TAG_SAMPLE: Record<string, unknown> = {
	type: 'conversation_part_tag',
	created_at: 1739524230,
	tag: { type: 'tag', id: '7522907', name: 'Bug' },
	conversation: {
		type: 'conversation',
		id: '2',
		title: '',
		state: 'open',
		open: true,
		read: false,
		priority: 'not_priority',
		created_at: 1739105560,
		updated_at: 1739524230,
		waiting_since: null,
		snoozed_until: null,
		admin_assignee_id: 7654321,
		team_assignee_id: 0,
	},
};
