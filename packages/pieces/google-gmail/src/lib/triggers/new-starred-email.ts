import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<unknown, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ lastFetchEpochMS, auth }) => {
    // TODO: call Gmail API to list starred messages since lastFetchEpochMS (max 2 days)
    const messages: Array<{id: string; internalDate: string}> = [];
    return messages.map((msg) => ({
      epochMilliSeconds: dayjs(Number(msg.internalDate)).valueOf(),
      data: msg,
    }));
  },
};

export const newStarredEmail = createTrigger({
  name: 'newStarredEmail',
  displayName: 'New Starred Email',
  description: 'Fires when a new email is starred within the last 2 days.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue: {} });
  },
  async onDisable(context) {
    const { store, auth } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue: {} });
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
