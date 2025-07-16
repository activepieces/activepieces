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
    // Only return those where tags are present and non-empty
    return conversations
      .filter((conv: any) => Array.isArray(conv.tags) && conv.tags.length > 0)
      .map((conv: any) => ({
        epochMilliSeconds: new Date(conv.modifiedAt).getTime(),
        data: conv,
      }));
  },
};

export const tagsUpdated = createTrigger({
  auth: helpScoutAuth,
  name: 'tags_updated',
  displayName: 'Tags Updated',
  description: 'Fires when tags on a conversation are modified.',
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