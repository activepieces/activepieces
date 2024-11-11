import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { weblingAuth } from '../../index';
import { WeblingChanges } from '../common/types';
import { getChanges } from '../common/helpers';

const polling: Polling<
  PiecePropValueSchema<typeof weblingAuth>,
  { calendarId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const changes: WeblingChanges = await getChanges(auth, lastFetchEpochMS);
    const items = [
      {
        epochMilliSeconds: Date.now(), // maybe use revision instead?
        data: changes,
      },
    ];
    return items;
  },
};

export const onChangedData = createTrigger({
  auth: weblingAuth,
  name: 'onChangedData',
  displayName: 'On Changed Data',
  description:
    'Triggers when anything was added, updated or deleted since last request.',
  props: {},
  sampleData: {
    objects: {
      account: [244, 246],
      accountgroup: [242],
      accountgrouptemplate: [241],
      accounttemplate: [243, 245, 247, 248, 250],
      apikey: [5241],
      article: [4579, 4580],
      articlegroup: [4578],
      calendar: [235, 4428],
      calendarevent: [4431, 4434, 4435, 4436],
      comment: [4423],
      debitor: [1205, 1208],
      debitorcategory: [650],
      document: [4506],
      documentgroup: [114],
      domain: [1771],
      email: [5085],
      entry: [321, 323, 338],
      entrygroup: [320, 322, 337],
      file: [4525],
      member: [4270, 4271, 398, 399],
      memberform: [4491],
      membergroup: [100],
      page: [4495],
      participant: [4460],
      period: [240],
      periodchain: [239],
      periodgroup: [238],
      settings: [233],
      template: [228],
      user: [120, 343, 345],
    },
    deleted: [235],
    context: [],
    definitions: ['member'],
    settings: false,
    quota: true,
    subscription: true,
    revision: 4758,
    version: 2560,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue,
    });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, {
      store,
      auth,
      propsValue,
    });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, {
      store,
      auth,
      propsValue,
    });
  },

  async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue,
    });
  },
});
