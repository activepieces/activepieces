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
import { parseurAuth, parseurCommon } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof parseurAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth: apiKey }) => {
    const response = await parseurCommon.listMailboxes({
      apiKey
    });
    const items = response.results;
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

export const newMailbox = createTrigger({
  auth: parseurAuth,
  name: 'newMailbox',
  displayName: 'New Mailbox',
  description: 'Fires when a new mailbox is created in the Parseur account.',
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
