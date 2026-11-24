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
import { newViewOutputSchema } from '../common/output-schemas';
import { qualifiedName } from '../common/sql';
import { mapView } from '../common/mappers';

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

    {
      const result = (
        await withSnowflake({
          auth: toAuthValue(auth),
          fn: (session) =>
            session.query({
              sql: `SHOW VIEWS IN SCHEMA ${qualifiedName({
                value: `${database}.${schema}`,
                maxParts: 2,
                label: 'Schema',
              })}`,
            }),
        })
      ).rows;

      return result.map((view) => ({
        epochMilliSeconds: toEpochMs(view['created_on']),
        data: mapView(view),
      }));
    }
  },
};

export const newViewTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_view',
  displayName: 'New View',
  description:
    'Triggers when a new view is created in the selected schema. Checked by polling every few minutes.',
  classification: 'READ',
  outputSchema: newViewOutputSchema,
  aiMetadata: {
    description:
      "Fires when a new view is created in the selected Snowflake database and schema, detected by polling and comparing each view's creation time against the last-seen watermark. Each newly created view produces one event with its name, owner, definition text, and metadata.",
  },
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
