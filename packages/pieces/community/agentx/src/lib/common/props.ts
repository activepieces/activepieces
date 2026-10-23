import { DropdownState, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../auth';
import { agentxApi } from './api';

function agentId<R extends boolean>({
  required,
  displayName = 'Agent',
  description = 'Select an AgentX agent',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: agentxAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your AgentX account first',
        });
      }
      try {
        const agents = await agentxApi.listAgents({ auth });
        return {
          disabled: false,
          options: agents.map((agent) => ({
            label: agent.name || `Agent ${agent.id}`,
            value: agent._id,
          })),
        };
      } catch (error) {
        return disabledOptions({
          placeholder: `Failed to fetch agents: ${errorText({ error })}`,
        });
      }
    },
  });
}

function conversationId<R extends boolean>({
  required,
  displayName = 'Conversation',
  description = 'Select a conversation for the chosen Agent',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: agentxAuth,
    displayName,
    description,
    required,
    refreshers: ['auth', 'agentId'],
    options: async ({ auth, agentId }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your AgentX account first',
        });
      }
      if (!agentId) {
        return disabledOptions({ placeholder: 'Select an Agent first' });
      }
      try {
        const conversations = await agentxApi.listConversations({
          auth,
          agentId: String(agentId),
        });
        return {
          disabled: false,
          options: conversations.map((c) => ({
            label: c.title || `Conversation ${c._id}`,
            value: c._id,
          })),
        };
      } catch (error) {
        return disabledOptions({
          placeholder: `Failed to fetch conversations: ${errorText({ error })}`,
        });
      }
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

function errorText({ error }: { error: unknown }): string {
  return error instanceof Error && error.message
    ? error.message
    : String(error);
}

export const agentxProps = { agentId, conversationId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
