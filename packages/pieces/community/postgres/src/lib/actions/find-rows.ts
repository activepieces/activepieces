import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon, postgresUtils, warningMarkdown } from '../common';
import { findRowsOutputSchema } from '../output-schemas';

export const findRows = createAction({
  auth: postgresAuth,
  name: 'find-rows',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  outputSchema: findRowsOutputSchema,
  aiMetadata: {
    description: 'Reads rows from a PostgreSQL table, optionally narrowed by a SQL WHERE condition and limited to specific columns. Use to look up or filter records by arbitrary criteria. The condition is interpolated raw into the query, so pass dynamic values through the args array and reference them as $1, $2 placeholders to avoid SQL injection. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    markdown: warningMarkdown,
    table: postgresCommon.table,
    condition: Property.ShortText({
      displayName: 'Condition',
      description: 'SQL condition without the WHERE keyword, such as `status = $1 AND age > $2`. Leave empty to read every row.',
      required: false,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for the $1, $2, ... placeholders used in the condition.',
      required: false,
    }),
    columns: postgresCommon.columns,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of rows to return. Leave empty to return every matching row.',
      required: false,
    }),
  },
  async run(context) {
    const { table, condition, args, columns, limit } = context.propsValue;

    const selected = columns && columns.length > 0
      ? columns.map((column) => postgresUtils.quoteIdentifier(column)).join(', ')
      : '*';

    const clauses = [`SELECT ${selected} FROM ${postgresUtils.qualifiedName(table)}`];
    if (condition && condition.trim().length > 0) {
      if (condition.includes(';')) {
        throw new Error('Condition must be a single expression and cannot contain ";". Pass values through Arguments as $1, $2, ... instead.');
      }
      clauses.push(`WHERE ${condition}`);
    }
    if (limit !== undefined && limit !== null) {
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error('Limit must be a positive integer.');
      }
      clauses.push(`LIMIT ${limit}`);
    }

    const client = await pgClient(context.auth);
    try {
      const result = await client.query(clauses.join(' '), args ?? []);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } finally {
      await client.end();
    }
  },
});
