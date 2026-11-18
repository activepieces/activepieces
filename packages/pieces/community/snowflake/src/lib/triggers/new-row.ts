import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  getTableColumnOptions,
  snowflakeCommonProps,
  toAuthValue,
} from '../common';
import { rowTriggerOutputSchema } from '../common/output-schemas';
import {
  fetchBaseline,
  fetchLatestRows,
  fetchNewRows,
  ROW_CURSOR_STORE_KEY,
} from '../common/row-poll';

const props = {
  database: snowflakeCommonProps.database,
  schema: snowflakeCommonProps.schema,
  table: snowflakeCommonProps.table,
  created_at_column: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Created At Column',
    description:
      'Select the column that stores when each row was inserted (e.g. `CREATED_AT`, `INSERT_TIME`). Only rows with a timestamp in this column newer than the last check will fire the trigger.',
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
      return getTableColumnOptions({
        auth: toAuthValue(auth),
        table: String(table),
      });
    },
  }),
};

export const newRowTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_row',
  classification: 'READ',
  displayName: 'New Row',
  description:
    'Triggers when a new row is inserted into the selected table. Uses a timestamp column you choose to detect rows added since the last check.',
  aiMetadata: {
    description:
      'Fires once per row whose chosen "created at" timestamp is later than the newest one already seen, oldest first, up to 1000 rows per poll (all rows sharing one exact timestamp are sent together, up to 10,000) (the rest follow on the next poll). Rows with an empty timestamp, or inserted with a timestamp older than the last seen one, never fire.',
  },
  outputSchema: rowTriggerOutputSchema,
  props,

  sampleData: {
    ID: 1001,
    NAME: 'Jane Doe',
    EMAIL: 'jane.doe@example.com',
    CREATED_AT: '2024-01-15T10:30:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { table, created_at_column } = context.propsValue;
    return fetchLatestRows({
      auth: toAuthValue(context.auth),
      table,
      column: created_at_column,
      limit: 5,
    });
  },
  async onEnable(context) {
    if (
      context.isRepublish &&
      (await context.store.get(ROW_CURSOR_STORE_KEY))
    ) {
      return;
    }
    const { table, created_at_column } = context.propsValue;
    const cursor = await fetchBaseline({
      auth: toAuthValue(context.auth),
      table,
      column: created_at_column,
    });
    await context.store.put(ROW_CURSOR_STORE_KEY, { cursor });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const { table, created_at_column } = context.propsValue;
    const auth = toAuthValue(context.auth);
    const stored = await context.store.get<{ cursor: string | null }>(
      ROW_CURSOR_STORE_KEY
    );
    if (!stored) {
      const cursor = await fetchBaseline({
        auth,
        table,
        column: created_at_column,
      });
      await context.store.put(ROW_CURSOR_STORE_KEY, { cursor });
      return [];
    }
    const page = await fetchNewRows({
      auth,
      table,
      column: created_at_column,
      after: stored.cursor,
    });
    if (page.rows.length > 0) {
      await context.store.put(ROW_CURSOR_STORE_KEY, { cursor: page.cursor });
    }
    return page.rows;
  },
});
