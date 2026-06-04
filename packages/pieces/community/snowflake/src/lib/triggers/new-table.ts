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

type NewTableProps = {
  database: string;
  schema: string;
};

const props = {
  database: snowflakeCommonProps.database,
  schema: snowflakeCommonProps.schema,
};

function toEpochMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return 0;
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof snowflakeAuth>,
  NewTableProps
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { database, schema } = propsValue;
    if (!database || !schema) return [];

    const connection = configureConnection(auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(
        connection,
        `SHOW TABLES IN SCHEMA ${database}.${schema}`,
        []
      );

      if (!result) return [];

      return (result as Record<string, unknown>[]).map((table) => ({
        epochMilliSeconds: toEpochMs(table['created_on']),
        data: {
          table_name: table['name'],
          database_name: table['database_name'],
          schema_name: table['schema_name'],
          kind: table['kind'],
          rows: table['rows'],
          bytes: table['bytes'],
          owner: table['owner'],
          comment: table['comment'],
          created_on: table['created_on'],
        },
      }));
    } finally {
      await destroy(connection);
    }
  },
};

export const newTableTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_table',
  displayName: 'New Table',
  description:
    'Triggers when a new table is created in the selected schema. Checked by polling every few minutes.',
  props,
  sampleData: {
    table_name: 'ORDERS',
    database_name: 'MY_DATABASE',
    schema_name: 'PUBLIC',
    kind: 'TABLE',
    rows: 0,
    bytes: 0,
    owner: 'SYSADMIN',
    comment: '',
    created_on: '2024-01-15T10:30:00.000Z',
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
