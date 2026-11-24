import { createAction, Property } from '@activepieces/pieces-framework';
import type { Bind } from 'snowflake-sdk';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { columnsQueryResult } from '../../common/columns';
import { listColumnsOutputSchema } from '../../common/output-schemas';
import {
  boundedInteger,
  identifierValue,
  qualifiedName,
} from '../../common/sql';

export const listColumnsAction = createAction({
  name: 'list_columns',
  classification: 'SEARCH',
  displayName: 'List Columns',
  description: 'Search columns across the tables of a database.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches INFORMATION_SCHEMA.COLUMNS of one database for columns, optionally narrowed to a schema, a table and a column name pattern (ILIKE). Use to find which tables hold a field such as EMAIL. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listColumnsOutputSchema,
  auth: snowflakeAuth,
  props: {
    database: aiProps.database(true),
    schema: Property.ShortText({
      displayName: 'Schema',
      description: 'Only columns in this schema.',
      required: false,
    }),
    table: Property.ShortText({
      displayName: 'Table',
      description: 'Only columns of this table.',
      required: false,
    }),
    columnPattern: Property.ShortText({
      displayName: 'Column Pattern',
      description:
        'Case-insensitive LIKE pattern on the column name, e.g. `%EMAIL%`.',
      required: false,
    }),
    limit: aiProps.limit(200, 1000),
  },
  async run(context) {
    const { database, schema, table, columnPattern, limit } =
      context.propsValue;
    const max = boundedInteger({
      value: limit,
      defaultValue: 200,
      min: 1,
      max: 1000,
      label: 'Limit',
    });
    const conditions: string[] = [`TABLE_SCHEMA <> 'INFORMATION_SCHEMA'`];
    const binds: Bind[] = [];
    if (schema && schema.trim() !== '') {
      conditions.push('TABLE_SCHEMA = ?');
      binds.push(identifierValue(schema));
    }
    if (table && table.trim() !== '') {
      conditions.push('TABLE_NAME = ?');
      binds.push(identifierValue(table));
    }
    if (columnPattern && columnPattern.trim() !== '') {
      conditions.push('COLUMN_NAME ILIKE ?');
      binds.push(columnPattern.trim());
    }
    const sql = `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COMMENT FROM ${qualifiedName(
      { value: database ?? '', maxParts: 1, label: 'Database' }
    )}.INFORMATION_SCHEMA.COLUMNS WHERE ${conditions.join(
      ' AND '
    )} ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION LIMIT ${max + 1}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql, binds, maxRows: max + 1 }),
    });
    return columnsQueryResult({ rows: result.rows, max });
  },
});
