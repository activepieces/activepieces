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

type NewViewProps = {
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
  NewViewProps
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
        `SHOW VIEWS IN SCHEMA ${database}.${schema}`,
        []
      );

      if (!result) return [];

      return (result as Record<string, unknown>[]).map((view) => ({
        epochMilliSeconds: toEpochMs(view['created_on']),
        data: {
          view_name: view['name'],
          database_name: view['database_name'],
          schema_name: view['schema_name'],
          owner: view['owner'],
          comment: view['comment'],
          text: view['text'],
          is_secure: view['is_secure'],
          is_materialized: view['is_materialized'],
          created_on: view['created_on'],
        },
      }));
    } finally {
      await destroy(connection);
    }
  },
};

export const newViewTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_view',
  displayName: 'New View',
  description:
    'Triggers when a new view is created in the selected schema. Checked by polling every few minutes.',
  props,
  sampleData: {
    view_name: 'ACTIVE_CUSTOMERS',
    database_name: 'MY_DATABASE',
    schema_name: 'PUBLIC',
    owner: 'SYSADMIN',
    comment: '',
    text: "CREATE VIEW ACTIVE_CUSTOMERS AS SELECT * FROM CUSTOMERS WHERE STATUS = 'ACTIVE'",
    is_secure: 'N',
    is_materialized: 'N',
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
