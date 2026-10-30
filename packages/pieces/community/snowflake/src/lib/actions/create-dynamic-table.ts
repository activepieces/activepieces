import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { dynamicTableOutputSchema } from '../common/output-schemas';
import { identifier, qualifiedName } from '../common/sql';

const TARGET_LAG = /^(DOWNSTREAM|\d{1,6}\s+(seconds?|minutes?|hours?|days?))$/i;

export const createDynamicTableAction = createAction({
  name: 'create_dynamic_table',
  classification: 'WRITE',
  displayName: 'Create / Refresh Dynamic Table',
  description:
    'Create or replace a Snowflake Dynamic Table that automatically refreshes based on a query. ' +
    'Dynamic Tables are a declarative way to define a table whose content is derived from a query, updated on a schedule.',
  audience: 'human',
  aiMetadata: {
    description:
      'CREATE OR REPLACE DYNAMIC TABLE from a SELECT query with a target lag and warehouse. Human-only DDL. Re-running with the same inputs recreates the same definition (REPLACE drops and rebuilds the table).',
    idempotent: true,
  },
  outputSchema: dynamicTableOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table_name: Property.ShortText({
      displayName: 'Dynamic Table Name',
      description:
        'The name for the new dynamic table (e.g. `DAILY_SALES_SUMMARY`). Only letters, digits, underscores, and `$` are allowed.',
      required: true,
    }),
    target_lag: Property.ShortText({
      displayName: 'Refresh Interval',
      description:
        'How up-to-date the dynamic table data should be (called **Target Lag** in Snowflake). Examples: `1 minute`, `5 minutes`, `1 hour`. Use `DOWNSTREAM` to only refresh when a downstream object explicitly requests it.',
      required: true,
      defaultValue: '1 hour',
    }),
    warehouse: snowflakeCommonProps.warehouse,
    query: Property.LongText({
      displayName: 'Source Query',
      description:
        'The SELECT statement that defines the content of the dynamic table. ' +
        'Example: `SELECT user_id, SUM(amount) AS total FROM orders GROUP BY user_id`',
      required: true,
    }),
  },
  async run(context) {
    const { database, schema, table_name, target_lag, warehouse, query } =
      context.propsValue;
    const identifierRegex = /^[A-Za-z_][A-Za-z0-9_$]*$/;
    if (!identifierRegex.test(table_name)) {
      throw new Error(
        'Invalid table name: only letters, digits, underscores, and $ are allowed.'
      );
    }
    const lag = target_lag.trim();
    if (!TARGET_LAG.test(lag)) {
      throw new Error(
        'Invalid Refresh Interval. Use a number and unit such as "5 minutes" or "1 hour", or DOWNSTREAM.'
      );
    }
    const effectiveWarehouse =
      warehouse || toAuthValue(context.auth).props.warehouse;
    if (!effectiveWarehouse) {
      throw new Error(
        'A warehouse is required. Provide it in the action props or set a default in your connection.'
      );
    }
    const target = `${qualifiedName({
      value: `${database}.${schema}`,
      maxParts: 2,
      label: 'Schema',
    })}.${table_name}`;
    const lagSql =
      lag.toUpperCase() === 'DOWNSTREAM' ? 'DOWNSTREAM' : `'${lag}'`;
    const sql = `CREATE OR REPLACE DYNAMIC TABLE ${target}
  TARGET_LAG = ${lagSql}
  WAREHOUSE = ${identifier({ name: effectiveWarehouse, label: 'Warehouse' })}
  AS ${query}`;
    await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql }),
    });
    return {
      success: true,
      table: `${database}.${schema}.${table_name}`,
      target_lag: lag,
      warehouse: effectiveWarehouse,
    };
  },
});
