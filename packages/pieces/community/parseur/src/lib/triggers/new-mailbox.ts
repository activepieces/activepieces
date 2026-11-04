import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import type { ParseurAuthValue } from '../common/types';

const polling: Polling<ParseurAuthValue, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await parseurApi.listMailboxes({ auth });
    const items = response.results;
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

export const newMailboxTrigger = createTrigger({
  auth: parseurAuth,
  name: 'newMailbox',
  classification: 'READ',
  displayName: 'New Mailbox',
  description: 'Fires when a new mailbox is created in the Parseur account.',
  aiMetadata: {
    description:
      'Fires when a new mailbox (parser) is created in the Parseur account, discovered by polling the list of mailboxes. Use to react to newly provisioned parsers/mailboxes.',
  },
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
