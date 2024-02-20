import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { airtableAuth } from '../../';
import { airtableCommon } from '../common';

const props = {
  base: airtableCommon.base,
  tableId: airtableCommon.tableId,
  viewId: airtableCommon.views,
};

const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const records = await airtableCommon.getTableSnapshot({
      personalToken: auth,
      baseId: propsValue.base,
      tableId: propsValue.tableId!,
      limitToView: propsValue.viewId,
    });
    return records.map((record) => ({
      epochMilliSeconds: Date.parse(record.createdTime),
      data: record,
    }));
  },
};

export const airtableNewRecordTrigger = createTrigger({
  auth: airtableAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to the selected table.',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
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
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
  },
});
