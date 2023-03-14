import { createTrigger, pollingHelper, DedupeStrategy, TimebasedPolling } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { airtableCommon } from '../common';

const polling: TimebasedPolling<{ authentication: string, table: string, base: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue }: { propsValue: { authentication: string, table: string, base: string } }) => {
    const records = await airtableCommon.getTableSnapshot({
      personalToken: propsValue.authentication,
      baseId: propsValue.base,
      tableId: propsValue.table,
    });
    return records.map((record) => ({
      epochMillSeconds: Date.parse(record.createdTime),
      data: record,
    }));
  }
}

export const airtableNewRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to the selected table.',
  props: {
    authentication: airtableCommon.authentication,
    base: airtableCommon.base,
    table: airtableCommon.table
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, { store: context.store, propsValue: context.propsValue });

  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, { store: context.store, propsValue: context.propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, { store: context.store, propsValue: context.propsValue });
  },
});
