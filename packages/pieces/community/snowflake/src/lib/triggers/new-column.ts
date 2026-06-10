import {
  createTrigger,
  TriggerStrategy,
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
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

type NewColumnProps = {
  database: string;
  schema: string;
  table: string;
};

const props = {
  database: snowflakeCommonProps.database,
  schema: snowflakeCommonProps.schema,
  table: snowflakeCommonProps.table,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof snowflakeAuth>,
  NewColumnProps
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const { table } = propsValue;
    if (!table) return [];

    const connection = configureConnection(auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, `DESCRIBE TABLE ${table}`, []);

      if (!result) return [];

      // Columns are returned in ordinal-position order (lowest first).
      // New columns are always appended at the end → highest index = newest.
      // Reverse so that LAST_ITEM deduplication stores the newest column's id
      // and emits only columns added after that position on subsequent polls.
      return (result as Record<string, unknown>[])
        .map((col, index) => ({
          id: index + 1,
          data: {
            column_name: col['name'],
            data_type: col['type'],
            nullable: col['null?'],
            default_value: col['default'],
            primary_key: col['primary key'],
            unique_key: col['unique key'],
            comment: col['comment'],
            position: index + 1,
            table,
          },
        }))
        .reverse();
    } finally {
      await destroy(connection);
    }
  },
};

export const newColumnTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_column',
  displayName: 'New Column',
  description:
    'Triggers when a new column is added to the selected table. Checked by polling every few minutes.',
  props,
  sampleData: {
    column_name: 'EMAIL',
    data_type: 'VARCHAR(256)',
    nullable: 'Y',
    default_value: null,
    primary_key: 'N',
    unique_key: 'N',
    comment: '',
    position: 5,
    table: 'MY_DATABASE.PUBLIC.CUSTOMERS',
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
