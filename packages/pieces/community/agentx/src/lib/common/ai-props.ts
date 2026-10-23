import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function agentId<R extends boolean>({
  required,
  displayName = 'Agent ID',
  description = 'AgentX agent ID (the `_id` field). Use List Agents to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function conversationId<R extends boolean>({
  required,
  displayName = 'Conversation ID',
  description = 'AgentX conversation ID (the `_id` field). Use List Conversations or Create Conversation to get it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function context<R extends boolean>({
  required,
  displayName = 'Memory Context',
  description = 'How many previous messages the agent considers: 0 = as many as possible, 1 = only the last message. Leave empty for the agent default.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const agentxAiProps = { agentId, conversationId, context };
