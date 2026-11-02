import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon, postgresUtils, warningMarkdown } from '../common';
import { findRowsOutputSchema } from '../output-schemas';

export const findRows = createAction({
  auth: postgresAuth,
  name: 'find-rows',
  classification: 'SEARCH',
  displayName: 'Find Rows',
  description: 'Reads rows from a table',
  audience: 'both',
  outputSchema: findRowsOutputSchema,
  aiMetadata: {
    description: 'Reads rows from a PostgreSQL table, optionally narrowed by a SQL WHERE condition and limited to specific columns. Use to look up or filter records by arbitrary criteria. Returns at most 100 rows unless limit is raised or cleared. The condition is interpolated raw into the query, so pass dynamic values through the args array and reference them as $1, $2 placeholders to avoid SQL injection. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'rows',
      display: 'section',
      label: 'Rows to find',
      icon: 'filter',
      props: ['markdown', 'table', 'condition', 'args'],
    },
    {
      key: 'result',
      display: 'section',
      label: 'What to return',
      icon: 'sliders',
      props: ['columns', 'limit'],
    },
  ],
  props: {
    markdown: warningMarkdown,
    table: postgresCommon.table,
    condition: Property.ShortText({
      displayName: 'Condition',
      description: 'The SQL after WHERE. Leave empty to read every row.',
      placeholder: 'status = $1 AND age > $2',
      required: false,
    }),
    args: Property.Array({
      displayName: 'Arguments',
      description: 'Values for $1, $2 and so on in the condition, in order.',
      required: false,
    }),
    columns: postgresCommon.columns,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum rows to return. Clear it to return every matching row.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { table, condition, args, columns, limit } = context.propsValue;

    const selected = columns && columns.length > 0
      ? columns.map((column) => postgresUtils.quoteIdentifier(column)).join(', ')
      : '*';

    const queryArgs = args ?? [];

    const clauses = [`SELECT ${selected} FROM ${postgresUtils.qualifiedName(table)}`];
    if (condition && condition.trim().length > 0) {
      if (queryArgs.length === 0 && condition.includes(';')) {
        throw new Error('A condition with no Arguments cannot contain ";", because it would be sent to the database unprepared and could run as more than one statement. Move the value into Arguments and reference it as $1 — that also covers a semicolon inside a string literal.');
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
      const result = await client.query(clauses.join(' '), queryArgs);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
      };
    } finally {
      await client.end();
    }
  },
});
