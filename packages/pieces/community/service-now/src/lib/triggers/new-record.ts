import {
  createTrigger,
  TriggerStrategy,
  Property,
  PiecePropValueSchema,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { servicenowAuth } from '../common/props';
import { tableDropdown, createServiceNowClient } from '../common/props';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof servicenowAuth>,
  { table: string; filter?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = createServiceNowClient(auth);
    const { table, filter } = propsValue;

    let query = `sys_created_on>${dayjs(lastFetchEpochMS).format(
      'YYYY-MM-DD HH:mm:ss'
    )}`;
    if (filter) {
      query += `^${filter}`;
    }

    const records = await client.findRecord(table, query, { limit: 100 });

    return records.map((record) => ({
      epochMilliSeconds: dayjs(record['sys_created_on']).valueOf(),
      data: record,
    }));
  },
};

export const newRecordTrigger = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a table',
  type: TriggerStrategy.POLLING,
  props: {
    table: tableDropdown,
    filter: Property.LongText({
      displayName: 'Filter Query',
      description: 'Encoded query to filter records (e.g., priority=1^state=1)',
      required: false,
    }),
  },
  sampleData: {
    sys_id: 'sample_sys_id',
    number: 'INC0000001',
    short_description: 'Sample incident',
    state: '1',
    priority: '3',
    sys_created_on: '2023-01-01 00:00:00',
    sys_updated_on: '2023-01-01 00:00:00',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth as any,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth as any,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth as any,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth as any,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
