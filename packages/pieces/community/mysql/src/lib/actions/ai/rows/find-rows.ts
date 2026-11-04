import { createAction, Property } from '@activepieces/pieces-framework';
import { mysqlAuth } from '../../../..';
import { mysqlAi, mysqlAiProps } from '../../../common/ai';
import { sanitizeColumnName } from '../../../common';
import { mysqlFindRowsOutputSchema } from '../../../output-schemas';

export const findRowsAi = createAction({
  auth: mysqlAuth,
  name: 'mysql_find_rows',
  outputSchema: mysqlFindRowsOutputSchema,
  displayName: 'Find Rows',
  description: 'Finds rows in a table using structured filters, sort and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns rows of a table or view matching all given filters (column, operator, value), optionally limited to chosen columns and sorted, with offset paging (hasMore, nextOffset). Values are sent as bound parameters. Use Count Rows for totals and Get Row by Key for one row by its key. Column names come from Describe Table. Read-only.',
    idempotent: true,
  },
  props: {
    table: mysqlAiProps.table,
    filters: mysqlAiProps.filters({ required: false }),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Columns to return. Leave empty for all columns.',
      required: false,
    }),
    sort: Property.Array({
      displayName: 'Sort',
      description: 'Sort order; each entry has a column and a direction (ASC or DESC). Set a sort when paging so pages are stable.',
      required: false,
      properties: {
        column: Property.ShortText({ displayName: 'Column', required: true }),
        direction: Property.StaticDropdown({
          displayName: 'Direction',
          required: false,
          defaultValue: 'ASC',
          options: { options: [{ label: 'ASC', value: 'ASC' }, { label: 'DESC', value: 'DESC' }] },
        }),
      },
    }),
    limit: mysqlAiProps.limit,
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of rows to skip, for paging. Use nextOffset from the previous call with the same filters and sort.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { table, filters, columns, sort, limit, offset } = context.propsValue;
    const max = mysqlAi.boundedInteger({ value: limit, defaultValue: mysqlAi.READ_DEFAULT_LIMIT, min: 1, max: mysqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const skip = mysqlAi.boundedInteger({ value: offset, defaultValue: 0, min: 0, max: Number.MAX_SAFE_INTEGER, label: 'Offset' });
    const where = mysqlAi.buildWhere({ filters });
    const columnList = (columns ?? []).map((column) => sanitizeColumnName(String(column)));
    const select = columnList.length > 0 ? columnList.join(', ') : '*';
    const sql = `SELECT ${select} FROM ${sanitizeColumnName(table)}${where.sql}${mysqlAi.buildOrderBy({ sort })} LIMIT ${max + 1} OFFSET ${skip}`;
    const found: unknown[] = await mysqlAi.withConnection({
      auth: context.auth,
      fn: (conn) => conn.query(sql, where.values),
    });
    const hasMore = found.length > max;
    const rows = found.slice(0, max);
    return { rows, count: rows.length, hasMore, nextOffset: hasMore ? skip + max : null };
  },
});
