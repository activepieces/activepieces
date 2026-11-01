import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { snowflakeCommonProps, toAuthValue, withSnowflake } from '../common';
import { rawRowsOutputSchema } from '../common/output-schemas';
import { boundedInteger, qualifiedName } from '../common/sql';

export const searchRowsAction = createAction({
  name: 'search_rows',
  classification: 'SEARCH',
  displayName: 'Search Rows',
  description:
    'Search for rows in a Snowflake table using an optional WHERE condition, ordering, and row limit.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns rows matching a hand-written WHERE and ORDER BY on a table picked from dropdowns. Human-only; agents use Find Rows with structured filters. Read-only.',
    idempotent: true,
  },
  outputSchema: rawRowsOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    where_clause: Property.ShortText({
      displayName: 'Filter Condition',
      description:
        "Optional SQL WHERE condition to narrow down results (e.g. `status = 'active' AND age > 18`). " +
        'Leave empty to return all rows (subject to the row limit). ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: false,
    }),
    order_by: Property.ShortText({
      displayName: 'Sort By',
      description:
        'Optional column(s) to sort results by (SQL ORDER BY clause). Examples: `created_at DESC` sorts newest first; `name ASC, age DESC` sorts by name then age. ' +
        '**Security note:** this value is embedded directly in SQL. Only use static values or data from trusted, internal steps — never pass unvalidated end-user input here.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Row Limit',
      description:
        'Maximum number of rows to return (1–10 000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { table, where_clause, order_by, limit } = context.propsValue;
    const rowLimit = boundedInteger({
      value:
        limit === undefined || limit === null ? undefined : Math.trunc(limit),
      defaultValue: 100,
      min: 1,
      max: 10000,
      label: 'Row Limit',
    });
    let sql = `SELECT * FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })}`;
    if (where_clause && where_clause.trim() !== '')
      sql += ` WHERE ${where_clause}`;
    if (order_by && order_by.trim() !== '') sql += ` ORDER BY ${order_by}`;
    sql += ` LIMIT ${rowLimit}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, maxRows: rowLimit }),
    });
    return result.rows;
  },
});
