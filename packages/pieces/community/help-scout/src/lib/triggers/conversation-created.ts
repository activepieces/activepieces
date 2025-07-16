import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';
import dayjs from 'dayjs';

const polling: Polling<any, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined;
    const params: Record<string, any> = {
      sortField: 'createdAt',
      sortOrder: 'desc',
    };
    if (since) params['query'] = `(createdAt:[${since} TO *])`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/conversations',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    const conversations = response.body._embedded?.conversations || [];
    return conversations.map((conv: any) => ({
      epochMilliSeconds: new Date(conv.createdAt).getTime(),
      data: conv,
    }));
  },
};

export const conversationCreated = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation_created',
  displayName: 'Conversation Created',
  description: 'Fires when a new conversation is started in a mailbox.',
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