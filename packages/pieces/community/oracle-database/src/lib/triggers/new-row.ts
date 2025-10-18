import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const newRowTrigger = createTrigger({
  auth: oracleDbAuth,
  name: 'new_row',
  displayName: 'New Row',
  description: 'Triggers when a new row is created in a table.',
  props: {
    tableName: oracleDbProps.tableName(),
    orderBy: oracleDbProps.orderBy(),
    filter: oracleDbProps.filter(),
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const { tableName, orderBy, filter } = context.propsValue;
    const client = new OracleDbClient(context.auth);

    const latestRowsResult = await client.getLatestRows(
      tableName,
      orderBy,
      (filter as Record<string, unknown>) || {}
    );

    let lastValue = null;
    if (latestRowsResult.rows && latestRowsResult.rows.length > 0) {
      lastValue = (latestRowsResult.rows[0] as Record<string, unknown>)[
        orderBy
      ];
    }

    await context.store.put('lastValue', lastValue);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onDisable(_context) {
    // No action needed.
  },

  async run(context) {
    const { tableName, orderBy, filter } = context.propsValue;
    const client = new OracleDbClient(context.auth);
    let lastValue = await context.store.get('lastValue');

    const filterConditions = (filter as Record<string, unknown>) || {};

    if (lastValue === null || lastValue === undefined) {
      const latestRowsResult = await client.getLatestRows(
        tableName,
        orderBy,
        filterConditions
      );

      if (latestRowsResult.rows && latestRowsResult.rows.length > 0) {
        const newLastValue = (
          latestRowsResult.rows[0] as Record<string, unknown>
        )[orderBy];
        await context.store.put('lastValue', newLastValue);
        lastValue = newLastValue;
      }

      return [];
    }

    const newRows = await client.getNewRows(
      tableName,
      orderBy,
      lastValue,
      filterConditions
    );

    if (newRows.length > 0) {
      const newLastValue = newRows[newRows.length - 1][orderBy];
      await context.store.put('lastValue', newLastValue);
      return newRows;
    }

    return [];
  },

  async test(context) {
    const { tableName, orderBy, filter } = context.propsValue;
    const client = new OracleDbClient(context.auth);
    const result = await client.getLatestRows(
      tableName,
      orderBy,
      (filter as Record<string, unknown>) || {}
    );
    return result.rows || [];
  },
  sampleData: {},
});
