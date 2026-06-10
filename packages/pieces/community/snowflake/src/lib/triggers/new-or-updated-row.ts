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

type NewOrUpdatedRowProps = {
  database: string;
  schema: string;
  table: string;
  updated_at_column: string;
};

const props = {
  database: snowflakeCommonProps.database,
  schema: snowflakeCommonProps.schema,
  table: snowflakeCommonProps.table,
  updated_at_column: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Updated At Column',
    description:
      'Select the column that stores when each row was last modified (e.g. `UPDATED_AT`, `LAST_MODIFIED_TIME`). ' +
      'Both new rows and rows updated after the last check will fire the trigger. ' +
      'The column must be updated by your application or a DEFAULT clause every time a row changes.',
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
  NewOrUpdatedRowProps
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { table, updated_at_column } = propsValue;
    if (!table || !updated_at_column) return [];

    const connection = configureConnection(auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      // Fetch the 100 most-recently modified rows. pollingHelper keeps only
      // rows whose timestamp exceeds the last stored watermark.
      const result = await execute(
        connection,
        `SELECT * FROM ${table} ORDER BY ${updated_at_column} DESC LIMIT 100`,
        []
      );

      if (!result) return [];

      return (result as Record<string, unknown>[]).map((row) => ({
        epochMilliSeconds: toEpochMs(row[updated_at_column]),
        data: row,
      }));
    } finally {
      await destroy(connection);
    }
  },
};

export const newOrUpdatedRowTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_or_updated_row',
  displayName: 'New or Updated Row',
  description:
    'Triggers when a row is inserted or updated in the selected table. Uses an "updated at" timestamp column you choose — any row whose timestamp is newer than the last check will fire the trigger.',
  props,
  sampleData: {
    ID: 1001,
    NAME: 'Jane Doe',
    EMAIL: 'jane.doe@example.com',
    UPDATED_AT: '2024-01-15T10:30:00.000Z',
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
