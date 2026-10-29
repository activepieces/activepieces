import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellOptions } from '../../common/options';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listChatsAction = createAction({
  auth: retellAiAuth,
  name: 'list_chats',
  classification: 'SEARCH',
  displayName: 'List Chats',
  description: 'Lists chats newest first with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Retell chats newest first, one page at a time, filtered by agent, status or chat type. Items have no transcript; use Get Chat for it. Pass pagination_key for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Chat Agent ID', description: 'Optional agent ID to only list its chats.', required: false }),
    chat_status: Property.ShortText({
      displayName: 'Chat Statuses',
      description: `Optional comma-separated statuses: ${retellOptions.CHAT_STATUSES.join(', ')}.`,
      required: false,
    }),
    chat_type: Property.StaticDropdown({
      displayName: 'Chat Type',
      required: false,
      options: { options: [{ label: 'API Chat', value: 'api_chat' }, { label: 'SMS Chat', value: 'sms_chat' }] },
    }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.chatPage,
  async run({ auth, propsValue }) {
    const filter: Record<string, unknown> = {};
    const agentId = retellInput.optionalText(propsValue.agent_id);
    if (agentId !== undefined) {
      filter['agent'] = [{ agent_id: agentId }];
    }
    const status = retellInput.enumFilter({ value: propsValue.chat_status, label: 'Chat Statuses', allowed: retellOptions.CHAT_STATUSES });
    if (status !== undefined) {
      filter['chat_status'] = status;
    }
    const chatType = retellInput.optionalText(propsValue.chat_type);
    if (chatType !== undefined) {
      filter['chat_type'] = { type: 'enum', op: 'in', value: [chatType] };
    }
    const body: Record<string, unknown> = { sort_order: 'descending', limit: retellInput.pageLimit(propsValue.limit) };
    if (Object.keys(filter).length > 0) {
      body['filter_criteria'] = filter;
    }
    const paginationKey = retellInput.optionalText(propsValue.pagination_key);
    if (paginationKey !== undefined) {
      body['pagination_key'] = paginationKey;
    }
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/v3/list-chats',
      body,
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.chatListItem });
  },
});

