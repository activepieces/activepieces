import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';
import dayjs from 'dayjs';

const polling: Polling<any, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined;
    const params: Record<string, any> = {
      sortField: 'modifiedAt',
      sortOrder: 'desc',
    };
    if (since) params['query'] = `(modifiedAt:[${since} TO *])`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/conversations',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    const conversations = response.body._embedded?.conversations || [];
    // Only return those where assignee is present (assigned)
    return conversations
      .filter((conv: any) => conv.assignee && conv.assignee.id)
      .map((conv: any) => ({
        epochMilliSeconds: new Date(conv.modifiedAt).getTime(),
        data: conv,
      }));
  },
};

export const conversationAssigned = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation_assigned',
  displayName: 'Conversation Assigned',
  description: 'Fires when a conversation is assigned to a user.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
}); 