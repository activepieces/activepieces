import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
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

const polling: Polling<AppConnectionValueForAuthProperty<typeof airtableAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const records = await airtableCommon.getTableSnapshot({
      personalToken: auth.secret_text,
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
