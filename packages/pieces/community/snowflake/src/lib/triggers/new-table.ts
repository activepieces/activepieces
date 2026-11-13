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
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { newTableOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';
import { mapTable } from '../common/mappers';

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

    {
      const result = (
        await withSnowflake({
          auth: toAuthValue(auth),
          fn: (session) =>
            session.query({
              sql: `SHOW TABLES IN SCHEMA ${qualifiedName({
                value: `${database}.${schema}`,
                maxParts: 2,
                label: 'Schema',
              })}`,
            }),
        })
      ).rows;

      return result.map((table) => ({
        epochMilliSeconds: toEpochMs(table['created_on']),
        data: mapTable(table),
      }));
    }
  },
};

export const newTableTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_table',
  displayName: 'New Table',
  description:
    'Triggers when a new table is created in the selected schema. Checked by polling every few minutes.',
  classification: 'READ',
  outputSchema: newTableOutputSchema,
  aiMetadata: {
    description:
      "Fires when a new table is created in the selected Snowflake database and schema, detected by polling and comparing each table's creation time against the last-seen watermark. Each newly created table produces one event with its name, kind, owner, and metadata.",
  },
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
