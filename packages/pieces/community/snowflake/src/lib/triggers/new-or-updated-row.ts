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
  updated_at_column: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Updated At Column',
    description:
      'Select the column that stores when each row was last modified (e.g. `UPDATED_AT`, `LAST_MODIFIED_TIME`). Both new rows and rows updated after the last check will fire the trigger. The column must be updated by your application or a DEFAULT clause every time a row changes.',
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

export const newOrUpdatedRowTrigger = createTrigger({
  auth: snowflakeAuth,
  name: 'new_or_updated_row',
  classification: 'READ',
  displayName: 'New or Updated Row',
  description:
    'Triggers when a row is inserted or updated in the selected table. Uses an "updated at" timestamp column you choose — any row whose timestamp is newer than the last check will fire the trigger.',
  aiMetadata: {
    description:
      'Fires once per row whose chosen "updated at" timestamp moved past the newest one already seen (inserts and updates alike), oldest first, up to 1000 rows per poll (all rows sharing one exact timestamp are sent together, up to 10,000). The column must be refreshed on every change; a row updated without advancing it does not fire.',
  },
  outputSchema: rowTriggerOutputSchema,
  props,

  sampleData: {
    ID: 1001,
    NAME: 'Jane Doe',
    EMAIL: 'jane.doe@example.com',
    UPDATED_AT: '2024-01-15T10:30:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { table, updated_at_column } = context.propsValue;
    return fetchLatestRows({
      auth: toAuthValue(context.auth),
      table,
      column: updated_at_column,
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
    const { table, updated_at_column } = context.propsValue;
    const cursor = await fetchBaseline({
      auth: toAuthValue(context.auth),
      table,
      column: updated_at_column,
    });
    await context.store.put(ROW_CURSOR_STORE_KEY, { cursor });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const { table, updated_at_column } = context.propsValue;
    const auth = toAuthValue(context.auth);
    const stored = await context.store.get<{ cursor: string | null }>(
      ROW_CURSOR_STORE_KEY
    );
    if (!stored) {
      const cursor = await fetchBaseline({
        auth,
        table,
        column: updated_at_column,
      });
      await context.store.put(ROW_CURSOR_STORE_KEY, { cursor });
      return [];
    }
    const page = await fetchNewRows({
      auth,
      table,
      column: updated_at_column,
      after: stored.cursor,
    });
    if (page.rows.length > 0) {
      await context.store.put(ROW_CURSOR_STORE_KEY, { cursor: page.cursor });
    }
    return page.rows;
  },
});
