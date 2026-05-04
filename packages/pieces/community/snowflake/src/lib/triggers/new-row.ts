import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  getTableColumnOptions,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

type NewRowProps = {
  database: string;
  schema: string;
  table: string;
  created_at_column: string;
};

const props = {
  database: snowflakeCommonProps.database,
  schema: snowflakeCommonProps.schema,
  table: snowflakeCommonProps.table,
  created_at_column: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Created At Column',
    description:
      'Select the column that stores when each row was inserted (e.g. `CREATED_AT`, `INSERT_TIME`). ' +
      'Only rows with a timestamp in this column newer than the last check will fire the trigger.',
    refreshers: ['table'],
    required: true,
    options: async ({ auth, table }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (!table) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a table first',
        };
      }
      return getTableColumnOptions(auth as SnowflakeAuthValue, table as string);
    },
  }),
};

function toEpochMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return 0;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof snowflakeAuth>,
  NewRowProps
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { table, created_at_column } = propsValue;
    if (!table || !created_at_column) return [];

    const connection = configureConnection(auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      // Fetch the 100 most-recently inserted rows. pollingHelper keeps only
      // rows whose timestamp exceeds the last stored watermark.
      const result = await execute(
        connection,
        `SELECT * FROM ${table} ORDER BY ${created_at_column} DESC LIMIT 100`,
        []
      );

      if (!result) return [];

      return (result as Record<string, unknown>[]).map((row) => ({
        epochMilliSeconds: toEpochMs(row[created_at_column]),
        data: row,
      }));
    } finally {
      await destroy(connection);
    }
  },
};

export const newRowTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_row',
  displayName: 'New Row',
  description:
    'Triggers when a new row is inserted into the selected table. Uses a timestamp column you choose to detect rows added since the last check.',
  props,
  sampleData: {
    ID: 1001,
    NAME: 'Jane Doe',
    EMAIL: 'jane.doe@example.com',
    CREATED_AT: '2024-01-15T10:30:00.000Z',
  },
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
