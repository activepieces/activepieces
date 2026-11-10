import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
import { listAgentsPage } from './list-agents';

export const listChatAgentsAction = createAction({
  auth: retellAiAuth,
  name: 'list_chat_agents',
  classification: 'SEARCH',
  displayName: 'List Chat Agents',
  description: 'Lists chat agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Retell chat (text/SMS) agents only, optionally matching a search text. Use it to find the agent_id for Create Chat or Create SMS Chat. Pass pagination_key for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Optional text matched against agent name and ID.', required: false }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.agentPage,
  async run({ auth, propsValue }) {
    return listAgentsPage({
      apiKey: apiKeyOf(auth),
      channel: 'chat',
      search: retellInput.optionalText(propsValue.search),
      limit: propsValue.limit,
      paginationKey: propsValue.pagination_key,
    });
  },
});
