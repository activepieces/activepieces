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
    const response = await timelinesAiCommon.listUploadedFiles({
      apiKey,
    });
    const items = response.data;
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.uploaded_at).valueOf(),
      data: item,
    }));
  },
};

export const newUploadedFile = createTrigger({
  auth: timelinesAiAuth,
  name: 'newUploadedFile',
  displayName: 'New Uploaded File',
  description: 'Fires when a new file is uploaded in a chat.',
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
