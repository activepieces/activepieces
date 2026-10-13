import {
  ChatPersonalizationView,
  UpsertChatPersonalizationRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

async function get(): Promise<ChatPersonalizationView> {
  return api.get<ChatPersonalizationView>('/v1/agents/personalization');
}

async function start(
  request: UpsertChatPersonalizationRequest,
): Promise<ChatPersonalizationView> {
  return api.post<ChatPersonalizationView>(
    '/v1/agents/personalization',
    request,
  );
}

export const personalizationApi = {
  get,
  start,
};
