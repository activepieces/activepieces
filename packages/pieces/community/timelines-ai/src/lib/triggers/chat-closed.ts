import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    createTrigger,
    PiecePropValueSchema,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof timelinesAiAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth: apiKey, propsValue, lastFetchEpochMS }) => {
    const response = await timelinesAiCommon.getChats({
      apiKey: apiKey as string,
      closed: true,
    });
    const items = response.data.chats;
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.last_message_timestamp).valueOf(),
      data: item,
    }));
  },
};

export const chatClosed = createTrigger({
  auth: timelinesAiAuth,
  name: 'chatClosed',
  displayName: 'Chat Closed',
  description: 'Fires when a chat is closed.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
