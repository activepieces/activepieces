import { Property } from '@activepieces/pieces-framework';
import { mistralApi } from './client';

function formatEntry(entry: ConversationEntry) {
	return {
		id: entry.id ?? null,
		type: entry.type ?? null,
		role: entry.role ?? null,
		content: mistralApi.contentToText(entry.content),
		name: entry.name ?? null,
		arguments: entry.arguments ?? null,
		agent_id: entry.agent_id ?? null,
		model: entry.model ?? null,
		created_at: entry.created_at ?? null,
	};
}

function formatResponse(response: ConversationResponse) {
	const outputs = response.outputs.map(formatEntry);
	const reply = outputs
		.filter((output) => output.type === 'message.output')
		.map((output) => output.content ?? '')
		.join('\n')
		.trim();
	return {
		conversation_id: response.conversation_id,
		reply: reply.length > 0 ? reply : null,
		outputs,
		prompt_tokens: response.usage?.prompt_tokens ?? null,
		completion_tokens: response.usage?.completion_tokens ?? null,
		total_tokens: response.usage?.total_tokens ?? null,
	};
}

function formatConversation(conversation: MistralConversation) {
	return {
		id: conversation.id,
		name: conversation.name ?? null,
		description: conversation.description ?? null,
		agent_id: conversation.agent_id ?? null,
		agent_version: conversation.agent_version ?? null,
		model: conversation.model ?? null,
		instructions: conversation.instructions ?? null,
		created_at: conversation.created_at,
		updated_at: conversation.updated_at,
	};
}

function conversationIdProp() {
	return Property.ShortText({
		displayName: 'Conversation ID',
		description: 'The conversation id (usually starts with conv_), from Start Conversation or List Conversations.',
		required: true,
	});
}

export const conversationUtils = { formatEntry, formatResponse, formatConversation, conversationIdProp };

export type ConversationEntry = {
	id?: string;
	type?: string;
	role?: string;
	content?: unknown;
	name?: string;
	arguments?: string;
	agent_id?: string | null;
	model?: string | null;
	created_at?: string;
};

export type ConversationResponse = {
	conversation_id: string;
	outputs: ConversationEntry[];
	usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export type MistralConversation = {
	id: string;
	name?: string | null;
	description?: string | null;
	agent_id?: string;
	agent_version?: number | string | null;
	model?: string;
	instructions?: string | null;
	created_at: string;
	updated_at: string;
};
